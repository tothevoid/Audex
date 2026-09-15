#nullable enable
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Auth;
using Audex.Application.DTO.Common;

namespace Audex.Application.Interfaces.Auth
{
    public interface IAuthService
    {
        Task<LoginResultDto> LoginAsync(string username, string password, string? ipAddress = null, string? userAgent = null);

        Task<TokenResponseDto> RefreshTokenAsync(string refreshToken, string? ipAddress = null, string? userAgent = null);

        Task<bool> RevokeTokenAsync(string refreshToken);

        Task<bool> RevokeAllUserTokensAsync(Guid userProfileId);

        Task<bool> ChangePasswordAsync(string userName, string currentPassword, string newPassword);

        Task<IEnumerable<UserRefreshTokenDto>> GetRefreshTokensAsync(Guid userProfileId, bool isActive = true, int pageIndex = 1, int recordsQuantity = 10, string? currentRefreshToken = null);

        Task<PaginationConfigDto> GetRefreshTokensPaginationAsync(Guid userProfileId, bool isActive = true);

        Task<bool> RevokeTokenAsync(Guid tokenId, Guid userProfileId);

        Task<bool> RevokeOtherTokensAsync(Guid userProfileId, string? currentRefreshToken);

        Task<int> CleanUpExpiredRefreshTokensAsync(int olderThanDays = 30);
    }
}
