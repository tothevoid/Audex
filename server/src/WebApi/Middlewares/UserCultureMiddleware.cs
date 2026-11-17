#nullable enable
using System;
using System.Globalization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Audex.Application.Enums.Localization;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.User;

namespace Audex.WebApi.Middlewares
{
    public class UserCultureMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<UserCultureMiddleware> _logger;

        public UserCultureMiddleware(RequestDelegate next, ILogger<UserCultureMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ITranslationProvider translationProvider)
        {
            var cultureName = await ResolveCultureAsync(context, translationProvider);
            var cultureInfo = new CultureInfo(cultureName);

            CultureInfo.CurrentCulture = cultureInfo;
            CultureInfo.CurrentUICulture = cultureInfo;

            await _next(context);
        }

        private async Task<string> ResolveCultureAsync(HttpContext context, ITranslationProvider translationProvider)
        {
            // 1. Check Accept-Language header from request
            var acceptLanguage = context.Request.Headers.AcceptLanguage.ToString();
            if (AppLanguageExtensions.TryParse(acceptLanguage, out var headerLanguage))
            {
                return headerLanguage.ToCode();
            }

            // 2. Check authenticated user profile in DB
            var userLanguage = await GetAuthenticatedUserLanguageAsync(context);
            if (userLanguage != null)
            {
                return userLanguage;
            }

            // 3. Fallback to default
            return translationProvider.GetDefaultLanguage();
        }

        private async Task<string?> GetAuthenticatedUserLanguageAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            try
            {
                var userProfileService = context.RequestServices.GetService<IUserProfileService>();
                if (userProfileService != null)
                {
                    var userProfile = await userProfileService.GetAsync();
                    if (userProfile != null && AppLanguageExtensions.TryParse(userProfile.LanguageCode, out var userLanguage))
                    {
                        return userLanguage.ToCode();
                    }
                }
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Failed to resolve culture for authenticated user.");
            }

            return null;
        }
    }
}
