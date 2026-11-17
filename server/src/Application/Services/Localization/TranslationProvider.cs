#nullable enable
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.Common;
using Audex.Application.Enums.Localization;
using Audex.Application.Interfaces.Localization;

namespace Audex.Application.Services.Localization
{
    public class TranslationProvider : ITranslationProvider
    {
        public const string DefaultLanguage = AppLanguageExtensions.DefaultLanguageCode;

        private static readonly LanguageDto[] SupportedLanguageDtos =
        [
            new() { Code = "en", Name = "English" },
            new() { Code = "ru", Name = "Русский" }
        ];

        private static readonly Regex ResourceNamePattern = new(
            @"\.Resources\.(?<lang>[a-zA-Z0-9_-]+)\.(?<cat>[a-zA-Z0-9_-]+)\.json$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> _translations = new(StringComparer.OrdinalIgnoreCase);
        private readonly ILogger<TranslationProvider>? _logger;

        public TranslationProvider(ILogger<TranslationProvider>? logger = null)
        {
            _logger = logger;
            LoadEmbeddedTranslations();
        }

        public string GetDefaultLanguage() => DefaultLanguage;
        public IReadOnlyList<LanguageDto> GetSupportedLanguages() => SupportedLanguageDtos;

        public LanguageDto GetLanguage(AppLanguage language)
        {
            var languageCode = language.ToCode();
            return SupportedLanguageDtos.First(languageItem => languageItem.Code == languageCode);
        }

        public LanguageDto GetLanguage(string languageCode)
        {
            var matchedLanguage = SupportedLanguageDtos.FirstOrDefault(languageItem =>
                string.Equals(languageItem.Code, languageCode, StringComparison.OrdinalIgnoreCase));

            if (matchedLanguage != null)
            {
                return matchedLanguage;
            }

            if (AppLanguageExtensions.TryParse(languageCode, out var language))
            {
                return GetLanguage(language);
            }

            return SupportedLanguageDtos[0];
        }

        public string GetTranslation(AppLanguage language, string key)
        {
            return GetTranslation(language.ToCode(), key);
        }

        public string GetTranslation(string languageCode, string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return string.Empty;
            }

            // 1. Direct O(1) dictionary lookup for exact code (e.g. "en", "ru")
            if (_translations.TryGetValue(languageCode, out var languageDictionary) &&
                languageDictionary.TryGetValue(key, out var translation))
            {
                return translation;
            }

            // 2. Fallback via AppLanguage resolution for external/regional codes (e.g. "en-US", "ru-RU")
            if (AppLanguageExtensions.TryParse(languageCode, out var language))
            {
                var normalizedCode = language.ToCode();
                if (_translations.TryGetValue(normalizedCode, out var resolvedDictionary) &&
                    resolvedDictionary.TryGetValue(key, out var resolvedTranslation))
                {
                    return resolvedTranslation;
                }
            }

            // 3. Fallback to default language
            if (!string.Equals(languageCode, DefaultLanguage, StringComparison.OrdinalIgnoreCase) &&
                _translations.TryGetValue(DefaultLanguage, out var defaultDictionary) &&
                defaultDictionary.TryGetValue(key, out var defaultTranslation))
            {
                return defaultTranslation;
            }

            // 4. Fallback to key itself
            return key;
        }

        public IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> GetAllTranslations()
        {
            var result = new Dictionary<string, IReadOnlyDictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in _translations)
            {
                result[kvp.Key] = kvp.Value;
            }
            return result;
        }

        private void LoadEmbeddedTranslations()
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceNames = assembly.GetManifestResourceNames();

            foreach (var resourceName in resourceNames)
            {
                var match = ResourceNamePattern.Match(resourceName);
                if (!match.Success)
                {
                    continue;
                }

                var language = match.Groups["lang"].Value.ToLowerInvariant();
                var category = match.Groups["cat"].Value;

                try
                {
                    using var stream = assembly.GetManifestResourceStream(resourceName);
                    if (stream == null)
                    {
                        continue;
                    }

                    using var reader = new StreamReader(stream);
                    var jsonContent = reader.ReadToEnd();

                    using var doc = JsonDocument.Parse(jsonContent);
                    var languageDictionary = _translations.GetOrAdd(language, _ => new ConcurrentDictionary<string, string>(StringComparer.OrdinalIgnoreCase));

                    foreach (var prop in doc.RootElement.EnumerateObject())
                    {
                        var value = prop.Value.GetString() ?? string.Empty;

                        var fullKey = $"{category}.{prop.Name}";
                        languageDictionary[fullKey] = value;
                        languageDictionary[prop.Name] = value;
                    }
                }
                catch (Exception exception)
                {
                    _logger?.LogError(exception, "Failed to load embedded localization resource '{ResourceName}'", resourceName);
                }
            }
        }
    }
}
