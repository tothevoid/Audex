#nullable enable
using System;
using System.Globalization;
using Microsoft.Extensions.Logging;
using Audex.Application.Enums.Localization;
using Audex.Application.Interfaces.Localization;

namespace Audex.Application.Services.Localization
{
    public class LocalizationService : ILocalizationService
    {
        private readonly ITranslationProvider _translationProvider;
        private readonly ILogger<LocalizationService> _logger;

        public LocalizationService(
            ITranslationProvider translationProvider,
            ILogger<LocalizationService> logger)
        {
            _translationProvider = translationProvider;
            _logger = logger;
        }

        public string Get(string key, params object[] args)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return string.Empty;
            }

            var currentCultureName = CultureInfo.CurrentUICulture.Name;
            if (!AppLanguageExtensions.TryParse(currentCultureName, out var appLanguage))
            {
                throw new InvalidOperationException(
                    $"Localization culture has not been initialized for key '{key}'. CurrentUICulture is '{currentCultureName}'. Ensure the request runs through UserCultureMiddleware or ScheduledJobBase.");
            }

            var template = _translationProvider.GetTranslation(appLanguage, key);

            if (args != null && args.Length > 0)
            {
                try
                {
                    return string.Format(CultureInfo.InvariantCulture, template, args);
                }
                catch (FormatException exception)
                {
                    _logger.LogWarning(exception, "Failed to format localized template for key '{Key}' with language '{Language}'", key, appLanguage.ToCode());
                    return template;
                }
            }

            return template;
        }
    }
}
