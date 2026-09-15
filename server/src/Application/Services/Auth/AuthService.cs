#nullable enable
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Audex.Application.DTO;
using Audex.Application.DTO.Auth;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.User;
using Audex.Application.Interfaces.Auth;
using Audex.Application.Interfaces.User;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.User;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Linq.Expressions;
using System.Security;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.Interfaces.Localization;

namespace Audex.Application.Services.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _uow;
        private readonly IRepository<UserProfile> _userProfileRepo;
        private readonly IRepository<UserRefreshToken> _refreshTokenRepo;
        private readonly IConfiguration _appConfig;
        private readonly IUserProfileService _userProfileService;
        private readonly ApplicationMapper _mapper;
        private readonly IPasswordHasherService _passwordHasher;
        private readonly ILocalizationService _localizer;

        public AuthService(
            ApplicationMapper mapper,
            IUnitOfWork uow,
            IConfiguration appConfig,
            IUserProfileService userProfileService,
            IPasswordHasherService passwordHasher,
            ILocalizationService localizer)
        {
            _uow = uow;
            _userProfileRepo = uow.CreateRepository<UserProfile>();
            _refreshTokenRepo = uow.CreateRepository<UserRefreshToken>();
            _appConfig = appConfig;
            _userProfileService = userProfileService;
            _mapper = mapper;
            _passwordHasher = passwordHasher;
            _localizer = localizer;
        }

        public async Task<LoginResultDto> LoginAsync(string userName, string password, string? ipAddress = null, string? userAgent = null)
        {
            var user = await _userProfileService.GetByAuthAsync(userName, password);

            if (user == null)
            {
                var errorMessage = await _localizer.GetForUserAsync(LocalizationKeys.Auth.InvalidCredentials);
                return LoginResultDto.Failure(errorMessage);
            }

            var isPasswordEmpty = string.IsNullOrEmpty(password) && string.IsNullOrEmpty(user.Password);

            var (accessToken, rawRefreshToken, refreshTokenEntity) = CreateRefreshTokenEntity(user, ipAddress, userAgent);

            await _refreshTokenRepo.AddAsync(refreshTokenEntity);
            await _uow.CommitAsync();

            return LoginResultDto.Success(new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken,
                PasswordChangeRequired = isPasswordEmpty,
                UserProfile = user
            });
        }

        public async Task<TokenResponseDto> RefreshTokenAsync(string refreshToken, string? ipAddress = null, string? userAgent = null)
        {
            var storedToken = await FindTokenByHashAsync(refreshToken);

            if (storedToken == null)
            {
                var errorMessage = await _localizer.GetForUserAsync(LocalizationKeys.Auth.InvalidToken);
                throw new SecurityException(errorMessage);
            }

            if (storedToken.IsRevoked)
            {
                await RevokeAllUserTokensAsync(storedToken.UserProfileId);
                var errorMessage = await _localizer.GetForUserAsync(LocalizationKeys.Auth.TokenCompromised, storedToken.UserProfileId);
                throw new SecurityException(errorMessage);
            }

            if (storedToken.IsUsed)
            {
                var graceResponse = await TryGetGracePeriodTokenResponseAsync(storedToken);
                if (graceResponse != null)
                {
                    return graceResponse;
                }

                await RevokeAllUserTokensAsync(storedToken.UserProfileId);
                var errorMessage = await _localizer.GetForUserAsync(LocalizationKeys.Auth.TokenCompromised, storedToken.UserProfileId);
                throw new SecurityException(errorMessage);
            }

            if (storedToken.ExpiresAt < DateTime.UtcNow)
            {
                var errorMessage = await _localizer.GetForUserAsync(LocalizationKeys.Auth.TokenExpired, storedToken.UserProfileId);
                throw new SecurityException(errorMessage);
            }

            var user = await _userProfileRepo.GetByIdAsync(storedToken.UserProfileId);
            if (user == null)
            {
                var errorMessage = await _localizer.GetForUserAsync(LocalizationKeys.Auth.UserNotFound);
                throw new SecurityException(errorMessage);
            }

            var userDto = _mapper.Map(user);
            var (newAccessToken, newRawRefreshToken, newRefreshTokenEntity) = CreateRefreshTokenEntity(userDto, ipAddress, userAgent);

            storedToken.IsUsed = true;
            storedToken.ReplacedByTokenId = newRefreshTokenEntity.Id;

            _refreshTokenRepo.Update(storedToken);
            await _refreshTokenRepo.AddAsync(newRefreshTokenEntity);
            await _uow.CommitAsync();

            return new TokenResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRawRefreshToken,
                ExpiresAt = newRefreshTokenEntity.ExpiresAt
            };
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            var storedToken = await FindTokenByHashAsync(refreshToken);
            return await RevokeTokenAsync(storedToken);
        }

        public Task<bool> RevokeAllUserTokensAsync(Guid userProfileId)
        {
            return RevokeTokensInternalAsync(userProfileId);
        }

        public async Task<bool> ChangePasswordAsync(string userName, string currentPassword, string newPassword)
        {
            var user = await _userProfileService.GetByAuthAsync(userName, currentPassword);

            if (user == null)
            {
                throw new ArgumentException(nameof(user));
            }

            var userEntity = await _userProfileRepo.GetByIdAsync(user.Id, disableTracking: false);
            if (userEntity == null)
            {
                throw new ArgumentException(nameof(user));
            }

            userEntity.Password = _passwordHasher.HashPassword(newPassword);
            _userProfileRepo.Update(userEntity);

            // Revoke all sessions on password change
            await RevokeAllUserTokensAsync(user.Id);

            await _uow.CommitAsync();
            return true;
        }

        public async Task<IEnumerable<UserRefreshTokenDto>> GetRefreshTokensAsync(
            Guid userProfileId,
            bool isActive = true,
            int pageIndex = 1,
            int recordsQuantity = 10,
            string? currentRefreshToken = null)
        {
            var filter = GetTokenFilter(userProfileId, isActive);

            var builder = new ComplexQueryBuilder<UserRefreshToken>()
                .AddFilter(filter);

            if (pageIndex > 0 && recordsQuantity > 0)
            {
                builder.AddPagination(pageIndex, recordsQuantity, t => t.CreatedAt, isDescending: true);
            }
            else
            {
                builder.AddOrder(t => t.CreatedAt, isDescending: true);
            }

            var tokens = await _refreshTokenRepo.GetAllAsync(builder.GetQuery());
            var currentHash = string.IsNullOrEmpty(currentRefreshToken) ? null : HashToken(currentRefreshToken);

            return tokens.Select(token => new UserRefreshTokenDto
            {
                Id = token.Id,
                CreatedByIp = token.CreatedByIp,
                UserAgent = token.UserAgent,
                CreatedAt = token.CreatedAt,
                ExpiresAt = token.ExpiresAt,
                IsCurrent = currentHash != null && token.TokenHash == currentHash,
                IsRevoked = token.IsRevoked,
                IsUsed = token.IsUsed
            });
        }

        public async Task<PaginationConfigDto> GetRefreshTokensPaginationAsync(Guid userProfileId, bool isActive = true)
        {
            var filter = GetTokenFilter(userProfileId, isActive);
            var recordsQuantity = await _refreshTokenRepo.GetCountAsync(filter);

            return new PaginationConfigDto
            {
                PageSize = 10,
                RecordsQuantity = recordsQuantity
            };
        }

        public async Task<bool> RevokeTokenAsync(Guid tokenId, Guid userProfileId)
        {
            var token = await _refreshTokenRepo.GetByIdAsync(tokenId);
            if (token == null || token.UserProfileId != userProfileId)
            {
                return false;
            }

            return await RevokeTokenAsync(token);
        }

        public Task<bool> RevokeOtherTokensAsync(Guid userProfileId, string? currentRefreshToken)
        {
            return RevokeTokensInternalAsync(userProfileId, currentRefreshToken);
        }

        public async Task<int> CleanUpExpiredRefreshTokensAsync(int olderThanDays = 30)
        {
            var threshold = DateTime.UtcNow.AddDays(-olderThanDays);

            // Filter criteria:
            // 1. Naturally expired tokens whose expiration date passed the threshold (e.g. > 30 days ago).
            // 2. Explicitly revoked tokens created before the threshold, allowing a retention window for audit/history UI before permanent removal.
            var tokensToDelete = (await _refreshTokenRepo.GetAllAsync(
                token => token.ExpiresAt < threshold || (token.IsRevoked && token.CreatedAt < threshold),
                disableTracking: false)).ToList();

            if (tokensToDelete.Count == 0)
            {
                return 0;
            }

            foreach (var token in tokensToDelete)
            {
                await _refreshTokenRepo.DeleteAsync(token.Id);
            }

            await _uow.CommitAsync();
            return tokensToDelete.Count;
        }

        private async Task<bool> RevokeTokenAsync(UserRefreshToken? token)
        {
            if (token == null || token.IsRevoked)
            {
                return false;
            }

            token.IsRevoked = true;
            _refreshTokenRepo.Update(token);
            await _uow.CommitAsync();
            return true;
        }

        private async Task<bool> RevokeTokensInternalAsync(Guid userProfileId, string? exceptRefreshToken = null)
        {
            var exceptHash = string.IsNullOrEmpty(exceptRefreshToken) ? null : HashToken(exceptRefreshToken);
            var activeTokens = await _refreshTokenRepo.GetAllAsync(token => token.UserProfileId == userProfileId && !token.IsRevoked);

            foreach (var token in activeTokens)
            {
                if (exceptHash != null && token.TokenHash == exceptHash)
                {
                    continue;
                }

                token.IsRevoked = true;
                _refreshTokenRepo.Update(token);
            }

            await _uow.CommitAsync();
            return true;
        }

        private static Expression<Func<UserRefreshToken, bool>> GetTokenFilter(Guid userProfileId, bool isActive)
        {
            if (isActive)
            {
                return token => token.UserProfileId == userProfileId &&
                                !token.IsRevoked &&
                                !token.IsUsed &&
                                token.ExpiresAt > DateTime.UtcNow;
            }

            return token => token.UserProfileId == userProfileId &&
                            (token.IsRevoked || token.IsUsed || token.ExpiresAt <= DateTime.UtcNow);
        }

        private async Task<TokenResponseDto?> TryGetGracePeriodTokenResponseAsync(UserRefreshToken storedToken)
        {
            if (!storedToken.ReplacedByTokenId.HasValue)
            {
                return null;
            }

            var replacementToken = await _refreshTokenRepo.GetByIdAsync(storedToken.ReplacedByTokenId.Value);
            if (replacementToken == null || replacementToken.IsRevoked || replacementToken.CreatedAt < DateTime.UtcNow.AddSeconds(-30))
            {
                return null;
            }

            var activeUser = await _userProfileRepo.GetByIdAsync(storedToken.UserProfileId);
            if (activeUser == null)
            {
                return null;
            }

            var activeUserDto = _mapper.Map(activeUser);
            var (activeAccessToken, _) = GenerateAccessToken(activeUserDto);

            return new TokenResponseDto
            {
                AccessToken = activeAccessToken,
                RefreshToken = string.Empty,
                ExpiresAt = replacementToken.ExpiresAt
            };
        }

        private async Task<UserRefreshToken?> FindTokenByHashAsync(string rawRefreshToken)
        {
            var tokenHash = HashToken(rawRefreshToken);
            var storedTokens = await _refreshTokenRepo.GetAllAsync(token => token.TokenHash == tokenHash);
            return storedTokens.FirstOrDefault();
        }

        private (string accessToken, string rawRefreshToken, UserRefreshToken entity) CreateRefreshTokenEntity(
            UserProfileDto user,
            string? ipAddress,
            string? userAgent)
        {
            var (accessToken, jwtId) = GenerateAccessToken(user);
            var rawRefreshToken = GenerateRefreshToken();
            var tokenHash = HashToken(rawRefreshToken);
            var expiresAt = DateTime.UtcNow.AddDays(30);

            var entity = new UserRefreshToken
            {
                Id = Guid.NewGuid(),
                UserProfileId = user.Id,
                TokenHash = tokenHash,
                JwtId = jwtId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                IsUsed = false,
                IsRevoked = false,
                CreatedByIp = ipAddress,
                UserAgent = userAgent
            };

            return (accessToken, rawRefreshToken, entity);
        }

        private (string token, string jti) GenerateAccessToken(UserProfileDto user)
        {
            var authSection = _appConfig.GetSection("Auth");
            var issuer = authSection.GetSection("Issuer").Value;
            var audience = authSection.GetSection("Audience").Value;
            var secret = authSection.GetSection("Secret").Value;

            var jti = Guid.NewGuid().ToString();

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, jti)
            };

            var jwt = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!)),
                    SecurityAlgorithms.HmacSha256));

            var token = new JwtSecurityTokenHandler().WriteToken(jwt);
            return (token, jti);
        }

        private static string GenerateRefreshToken()
        {
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }

        private static string HashToken(string rawToken)
        {
            var bytes = Encoding.UTF8.GetBytes(rawToken);
            var hash = SHA256.HashData(bytes);
            return Convert.ToHexStringLower(hash);
        }
    }
}