using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO;
using Audex.Application.DTO.Auth;
using Audex.Application.DTO.User;
using Audex.Application.Interfaces.Auth;
using Audex.Application.Interfaces.User;
using Audex.Application.Mappings;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.User;
using Audex.Infrastructure.Interfaces.Database;
using System;
using System.Linq;
using System.Security;
using System.Threading.Tasks;
using Xunit;

namespace Audex.Application.Tests.Services.Auth
{
    [Trait("Category", "Auth")]
    public class AuthServiceTests : TestBase
    {
        public AuthServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        private async Task<(UserProfileDto User, string RawPassword)> EnsureUserWithKnownPasswordAsync(string rawPassword = "TestPassword123!")
        {
            return await ExecuteScopeAsync(async sp =>
            {
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var userProfileRepo = uow.CreateRepository<UserProfile>();
                var passwordHasher = sp.GetRequiredService<IPasswordHasherService>();

                var user = (await userProfileRepo.GetAllAsync(disableTracking: false)).FirstOrDefault();
                if (user == null)
                {
                    user = new UserProfile
                    {
                        Id = UserProfileConstants.UserProfileId,
                        UserName = "admin",
                        LanguageCode = "en-US",
                        CurrencyId = CurrencyConstants.USD,
                        Password = passwordHasher.HashPassword(rawPassword)
                    };
                    await userProfileRepo.AddAsync(user);
                }
                else
                {
                    user.Password = passwordHasher.HashPassword(rawPassword);
                    userProfileRepo.Update(user);
                }

                await uow.CommitAsync();

                var mapper = sp.GetRequiredService<ApplicationMapper>();
                var dto = mapper.Map(user);
                return (dto, rawPassword);
            });
        }

        [Fact]
        public async Task TestLogin_Success_ReturnsTokens()
        {
            var (user, currentPassword) = await EnsureUserWithKnownPasswordAsync();

            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, currentPassword);
            });

            Assert.NotNull(loginResult);
            Assert.True(loginResult.IsSuccess);
            Assert.NotNull(loginResult.Data);
            Assert.False(string.IsNullOrWhiteSpace(loginResult.Data.AccessToken));
            Assert.False(string.IsNullOrWhiteSpace(loginResult.Data.RefreshToken));
        }

        [Fact]
        public async Task TestChangePassword_Success_AllowsLoginWithNewPassword()
        {
            var (user, currentPassword) = await EnsureUserWithKnownPasswordAsync();
            var newPassword = "newPassword_" + Guid.NewGuid().ToString("N");

            var changeResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.ChangePasswordAsync(user.UserName, currentPassword, newPassword);
            });

            Assert.True(changeResult);

            var newLoginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, newPassword);
            });

            Assert.NotNull(newLoginResult);
            Assert.True(newLoginResult.IsSuccess);
            Assert.NotNull(newLoginResult.Data);
            Assert.False(string.IsNullOrWhiteSpace(newLoginResult.Data.AccessToken));
            Assert.False(string.IsNullOrWhiteSpace(newLoginResult.Data.RefreshToken));
        }

        [Fact]
        public async Task TestLogin_WithInvalidCredentials_ReturnsFailureResult()
        {
            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync("non_existent_user_12345", "wrong_password");
            });

            Assert.NotNull(loginResult);
            Assert.False(loginResult.IsSuccess);
            Assert.Null(loginResult.Data);
            Assert.False(string.IsNullOrWhiteSpace(loginResult.ErrorMessage));
        }

        [Fact]
        public async Task TestRefreshToken_SuccessfulRotation()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            // Perform refresh
            var refreshResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RefreshTokenAsync(loginResult.Data!.RefreshToken);
            });

            Assert.NotNull(refreshResult);
            Assert.False(string.IsNullOrWhiteSpace(refreshResult.AccessToken));
            Assert.False(string.IsNullOrWhiteSpace(refreshResult.RefreshToken));
            Assert.NotEqual(loginResult.Data!.RefreshToken, refreshResult.RefreshToken);

            // Subsequent refresh using the newly rotated token should succeed
            var secondRefreshResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RefreshTokenAsync(refreshResult.RefreshToken);
            });

            Assert.NotNull(secondRefreshResult);
            Assert.False(string.IsNullOrWhiteSpace(secondRefreshResult.AccessToken));
            Assert.False(string.IsNullOrWhiteSpace(secondRefreshResult.RefreshToken));
        }

        [Fact]
        public async Task TestRefreshToken_WithinGracePeriod_Succeeds()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            // Legitimate refresh rotates the token
            var refreshResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RefreshTokenAsync(loginResult.Data!.RefreshToken);
            });

            Assert.NotNull(refreshResult);

            // Concurrent request within 30s grace window sends the old login token again
            var concurrentResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RefreshTokenAsync(loginResult.Data!.RefreshToken);
            });

            Assert.NotNull(concurrentResult);
            Assert.False(string.IsNullOrWhiteSpace(concurrentResult.AccessToken));
        }

        [Fact]
        public async Task TestRefreshToken_ReuseDetection_RevokesAllSessions()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            // Legitimate refresh rotates the token (old token marked as used)
            var refreshResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RefreshTokenAsync(loginResult.Data!.RefreshToken);
            });

            Assert.NotNull(refreshResult);

            // Simulate that the replacement token was created outside the 30-second grace window (e.g. 2 minutes ago)
            await ExecuteScopeAsync(async sp =>
            {
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var tokenRepo = uow.CreateRepository<UserRefreshToken>();
                var tokens = await tokenRepo.GetAllAsync(t => t.UserProfileId == user.Id);
                foreach (var t in tokens)
                {
                    t.CreatedAt = DateTime.UtcNow.AddMinutes(-2);
                    tokenRepo.Update(t);
                }
                await uow.CommitAsync();
            });

            // Attacker tries to reuse the old loginResult.RefreshToken outside grace window
            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(loginResult.Data!.RefreshToken);
                });
            });

            // Because reuse was detected, all tokens (including refreshResult.RefreshToken) are now revoked
            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(refreshResult.RefreshToken);
                });
            });
        }

        [Fact]
        public async Task TestRevokeToken_Success()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            var revoked = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RevokeTokenAsync(loginResult.Data!.RefreshToken);
            });

            Assert.True(revoked);

            // Trying to refresh revoked token should fail
            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(loginResult.Data!.RefreshToken);
                });
            });
        }

        [Fact]
        public async Task TestRevokeAllUserTokens_Success()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var session1 = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            var session2 = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            var revoked = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RevokeAllUserTokensAsync(user.Id);
            });

            Assert.True(revoked);

            // Both sessions should be revoked
            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(session1.Data!.RefreshToken);
                });
            });

            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(session2.Data!.RefreshToken);
                });
            });
        }

        [Fact]
        public async Task TestGetRefreshTokensAndPagination_ActiveAndInactive()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            // Login 2 sessions
            var session1 = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password, "192.168.1.1", "Chrome on Windows");
            });

            var session2 = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password, "10.0.0.1", "Safari on iPhone");
            });

            // Get active tokens
            var activeTokens = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.GetRefreshTokensAsync(user.Id, isActive: true, 1, 10, session1.Data!.RefreshToken);
            });

            Assert.NotNull(activeTokens);
            Assert.Contains(activeTokens, s => s.IsCurrent && s.CreatedByIp == "192.168.1.1");
            Assert.Contains(activeTokens, s => !s.IsCurrent && s.CreatedByIp == "10.0.0.1");

            // Pagination config
            var paginationConfig = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.GetRefreshTokensPaginationAsync(user.Id, isActive: true);
            });

            Assert.NotNull(paginationConfig);
            Assert.True(paginationConfig.RecordsQuantity >= 2);
        }

        [Fact]
        public async Task TestRevokeSingleToken_Success()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var session = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password, "192.168.1.50", "Firefox on Linux");
            });

            var activeTokens = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.GetRefreshTokensAsync(user.Id, isActive: true);
            });

            var targetToken = Assert.Single(activeTokens, s => s.CreatedByIp == "192.168.1.50");

            var revoked = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RevokeTokenAsync(targetToken.Id, user.Id);
            });

            Assert.True(revoked);

            // Verify session is no longer active and fails refresh
            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(session.Data!.RefreshToken);
                });
            });
        }

        [Fact]
        public async Task TestRevokeOtherTokens_Success()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var currentSession = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password, "192.168.1.100", "Current Browser");
            });

            var otherSession = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password, "192.168.1.200", "Other Browser");
            });

            var revokedOthers = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RevokeOtherTokensAsync(user.Id, currentSession.Data!.RefreshToken);
            });

            Assert.True(revokedOthers);

            // Current session should still be refreshable
            var refreshedCurrent = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.RefreshTokenAsync(currentSession.Data!.RefreshToken);
            });

            Assert.NotNull(refreshedCurrent);
            Assert.False(string.IsNullOrEmpty(refreshedCurrent.AccessToken));

            // Other session must be revoked and fail refresh
            await Assert.ThrowsAsync<SecurityException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var authService = sp.GetRequiredService<IAuthService>();
                    await authService.RefreshTokenAsync(otherSession.Data!.RefreshToken);
                });
            });
        }

        [Fact]
        public async Task TestCleanUpExpiredRefreshTokens()
        {
            var (user, password) = await EnsureUserWithKnownPasswordAsync();

            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, password);
            });

            Assert.NotNull(loginResult);
            Assert.True(loginResult.IsSuccess);

            // Mark token as expired in DB
            await ExecuteScopeAsync(async sp =>
            {
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var tokenRepo = uow.CreateRepository<UserRefreshToken>();
                var token = (await tokenRepo.GetAllAsync(t => t.UserProfileId == user.Id, disableTracking: false)).First();
                token.ExpiresAt = DateTime.UtcNow.AddDays(-31);
                tokenRepo.Update(token);
                await uow.CommitAsync();
            });

            // Clean up tokens older than 30 days
            var deletedCount = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.CleanUpExpiredRefreshTokensAsync(olderThanDays: 30);
            });

            Assert.True(deletedCount >= 1);
        }

        [Fact]
        public async Task TestPasswordLazyMigration_PlainTextToArgon2id()
        {
            var plainPassword = "LegacyPlainTextPassword_" + Guid.NewGuid().ToString("N");

            // Manually set plain text password for user in DB
            var user = await ExecuteScopeAsync(async sp =>
            {
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var repo = uow.CreateRepository<UserProfile>();
                var userEntity = (await repo.GetAllAsync(disableTracking: false)).First();
                userEntity.Password = plainPassword;
                repo.Update(userEntity);
                await uow.CommitAsync();

                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.Equal(plainPassword, user.Password);

            // First Login with plain text password triggers lazy migration to Argon2id
            var loginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, plainPassword);
            });

            Assert.NotNull(loginResult);
            Assert.True(loginResult.IsSuccess);

            // Check that database password has been updated to Argon2id format
            var updatedUser = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.StartsWith("$argon2id$v=19$m=65536,t=3,p=2$", updatedUser.Password);

            // Second Login verifies against the Argon2id hash successfully
            var secondLoginResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, plainPassword);
            });

            Assert.NotNull(secondLoginResult);
            Assert.True(secondLoginResult.IsSuccess);

            // Login with wrong password returns failure result
            var wrongPasswordResult = await ExecuteScopeAsync(async sp =>
            {
                var authService = sp.GetRequiredService<IAuthService>();
                return await authService.LoginAsync(user.UserName, "IncorrectPassword");
            });

            Assert.NotNull(wrongPasswordResult);
            Assert.False(wrongPasswordResult.IsSuccess);
            Assert.False(string.IsNullOrWhiteSpace(wrongPasswordResult.ErrorMessage));
        }
    }
}
