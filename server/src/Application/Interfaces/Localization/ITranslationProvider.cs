#nullable enable
using System.Collections.Generic;
using Audex.Application.DTO.Common;
using Audex.Application.Enums.Localization;

namespace Audex.Application.Interfaces.Localization
{
    public interface ITranslationProvider
    {
        string GetDefaultLanguage();
        IReadOnlyList<LanguageDto> GetSupportedLanguages();

        LanguageDto GetLanguage(string languageCode);
        LanguageDto GetLanguage(AppLanguage language);

        string GetTranslation(string languageCode, string key);
        string GetTranslation(AppLanguage language, string key);

        IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> GetAllTranslations();
    }
}
