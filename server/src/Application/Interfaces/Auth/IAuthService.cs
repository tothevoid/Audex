#nullable enable
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Auth;
using Audex.Application.DTO.Common;
using Audex.Shared.Common;

namespace Audex.Application.Interfaces.Auth
{
    public interface IAuthService
    {
        Task<AuthStatusDto> GetAuthStatusAsync();

        Task<LoginResultDto> InitialSetupAsync(string userName, string password, string? ipAddress = null, string? userAgent = null);

        Task<LoginResultDto> LoginAsync(string username, string password, string? ipAddress = null, string? userAgent = null);

        Task<TokenResponseDto> RefreshTokenAsync(string refreshToken, string? ipAddress = null, string? userAgent = null);

        Task<bool> RevokeTokenAsync(string refreshToken);

        Task<bool> RevokeAllUserTokensAsync(Guid userProfileId);

        Task<bool> ChangePasswordAsync(string userName, string currentPassword, string newPassword);

        Task<PagedResult<UserRefreshTokenDto>> GetRefreshTokensAsync(UserRefreshTokenFilterDto filter);

        Task<bool> RevokeTokenAsync(Guid tokenId, Guid userProfileId);

        Task<bool> RevokeOtherTokensAsync(Guid userProfileId, string? currentRefreshToken);

        Task<int> CleanUpExpiredRefreshTokensAsync(int olderThanDays = 30);
    }
}
