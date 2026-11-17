#nullable enable

namespace Audex.Application.Interfaces.Localization
{
    public interface ILocalizationService
    {
        string Get(string key, params object[] args);
    }
}
