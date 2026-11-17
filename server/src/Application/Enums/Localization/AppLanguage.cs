#nullable enable
using System;

namespace Audex.Application.Enums.Localization
{
    public enum AppLanguage
    {
        En,
        Ru
    }

    public static class AppLanguageExtensions
    {
        public const string DefaultLanguageCode = "en";

        public static string ToCode(this AppLanguage language)
        {
            return language switch
            {
                AppLanguage.Ru => "ru",
                _ => "en"
            };
        }

        public static bool TryParse(string? value, out AppLanguage language)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                var trimmedValue = value.Trim();

                if (trimmedValue.StartsWith("ru", StringComparison.OrdinalIgnoreCase))
                {
                    language = AppLanguage.Ru;
                    return true;
                }

                if (trimmedValue.StartsWith("en", StringComparison.OrdinalIgnoreCase))
                {
                    language = AppLanguage.En;
                    return true;
                }
            }

            language = default;
            return false;
        }

        public static AppLanguage FromCodeOrDefault(string? value)
        {
            return TryParse(value, out var language) ? language : AppLanguage.En;
        }
    }
}
