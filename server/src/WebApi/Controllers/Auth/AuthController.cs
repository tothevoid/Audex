#nullable enable
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Auth;
using Audex.Application.Interfaces.Auth;
using Audex.WebApi.Models.Auth;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Auth
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private const string RefreshTokenCookieKey = "refreshToken";
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost(nameof(Login))]
        public async Task<IActionResult> Login([FromBody] LoginModel loginData)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers.UserAgent.ToString();

            var result = await _authService.LoginAsync(loginData.UserName, loginData.Password, ipAddress, userAgent);

            if (!result.IsSuccess || result.Data == null)
            {
                return Unauthorized(new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Unauthorized",
                    Detail = result.ErrorMessage
                });
            }

            var responseData = result.Data;

            if (responseData.PasswordChangeRequired)
            {
                return Ok(responseData);
            }

            if (!string.IsNullOrEmpty(responseData.RefreshToken))
            {
                SetRefreshTokenCookie(responseData.RefreshToken, DateTime.UtcNow.AddDays(30));
            }

            return Ok(responseData);
        }

        [HttpPost(nameof(RefreshToken))]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto? request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers.UserAgent.ToString();
            
            var refreshToken = request?.RefreshToken;
            var hasCookie = Request.Cookies.TryGetValue(RefreshTokenCookieKey, out var cookieToken);

            if (string.IsNullOrEmpty(refreshToken) && hasCookie)
            {
                refreshToken = cookieToken;
            }

            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token is missing." });
            }

            try
            {
                var result = await _authService.RefreshTokenAsync(refreshToken, ipAddress, userAgent);
                if (!string.IsNullOrEmpty(result.RefreshToken))
                {
                    SetRefreshTokenCookie(result.RefreshToken, result.ExpiresAt);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                ClearRefreshTokenCookie();
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost(nameof(RevokeToken))]
        public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequestDto? request)
        {
            var hasCookie = Request.Cookies.TryGetValue(RefreshTokenCookieKey, out var cookieToken);
            var refreshToken = request?.RefreshToken;
            if (string.IsNullOrEmpty(refreshToken) && hasCookie)
            {
                refreshToken = cookieToken;
            }

            if (!string.IsNullOrEmpty(refreshToken))
            {
                await _authService.RevokeTokenAsync(refreshToken);
            }

            ClearRefreshTokenCookie();
            return Ok(new { message = "Token revoked." });
        }

        [Authorize]
        [HttpPost(nameof(RevokeAll))]
        public async Task<IActionResult> RevokeAll()
        {
            if (TryGetCurrentUserId(out var userId))
            {
                await _authService.RevokeAllUserTokensAsync(userId);
            }

            ClearRefreshTokenCookie();
            return Ok(new { message = "All sessions revoked." });
        }

        [HttpPost(nameof(ChangePassword))]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel changePasswordData)
        {
            var changed = await _authService.ChangePasswordAsync(
                changePasswordData.UserName,
                changePasswordData.CurrentPassword,
                changePasswordData.NewPassword);

            if (changed)
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers.UserAgent.ToString();

                var result = await _authService.LoginAsync(
                    changePasswordData.UserName,
                    changePasswordData.NewPassword,
                    ipAddress,
                    userAgent);

                if (!result.IsSuccess || result.Data == null)
                {
                    return BadRequest(new ProblemDetails
                    {
                        Status = StatusCodes.Status400BadRequest,
                        Title = "Bad Request",
                        Detail = result.ErrorMessage ?? "Login failed after password change."
                    });
                }

                var responseData = result.Data;

                if (!string.IsNullOrEmpty(responseData.RefreshToken))
                {
                    SetRefreshTokenCookie(responseData.RefreshToken, DateTime.UtcNow.AddDays(30));
                }

                return Ok(responseData);
            }

            return BadRequest("Password change failed.");
        }

        [Authorize]
        [HttpGet("RefreshTokens")]
        public async Task<IActionResult> GetRefreshTokens([FromQuery] bool isActive = true, [FromQuery] int pageIndex = 1, [FromQuery] int recordsQuantity = 10)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            Request.Cookies.TryGetValue(RefreshTokenCookieKey, out var currentCookieToken);
            var tokens = await _authService.GetRefreshTokensAsync(userId, isActive, pageIndex, recordsQuantity, currentCookieToken);
            return Ok(tokens);
        }

        [Authorize]
        [HttpGet("RefreshTokens/Pagination")]
        public async Task<IActionResult> GetRefreshTokensPagination([FromQuery] bool isActive = true)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var pagination = await _authService.GetRefreshTokensPaginationAsync(userId, isActive);
            return Ok(pagination);
        }

        [Authorize]
        [HttpDelete("RefreshTokens/{id:guid}")]
        public async Task<IActionResult> RevokeToken(Guid id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var revoked = await _authService.RevokeTokenAsync(id, userId);
            return revoked ? Ok(new { message = "Token revoked." }) : NotFound();
        }

        [Authorize]
        [HttpPost("RevokeOthers")]
        public async Task<IActionResult> RevokeOtherTokens()
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            Request.Cookies.TryGetValue(RefreshTokenCookieKey, out var currentCookieToken);
            await _authService.RevokeOtherTokensAsync(userId, currentCookieToken);
            return Ok(new { message = "Other tokens revoked." });
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out userId);
        }

        private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = expiresAt,
                Path = "/Auth"
            };

            Response.Cookies.Append(RefreshTokenCookieKey, refreshToken, cookieOptions);
        }

        private void ClearRefreshTokenCookie()
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/Auth"
            };

            Response.Cookies.Delete(RefreshTokenCookieKey, cookieOptions);
        }
    }
}