using System;
using System.Globalization;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO;
using Audex.Application.DTO.User;
using Audex.Application.Enums.Localization;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.User;
using Audex.Application.Services.Localization;
using Audex.Infrastructure.Constants;
using Audex.Tests.Shared.Fixtures;
using Xunit;

namespace Audex.Application.Tests.Services.Localization
{
    public class LocalizationServiceTests : TestBase
    {
        public LocalizationServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestLocalization_English_ReturnsCorrectText()
        {
            await ExecuteScopeAsync(sp =>
            {
                var localizer = sp.GetRequiredService<ILocalizationService>();
                CultureInfo.CurrentUICulture = new CultureInfo("en");

                var title = localizer.Get("session_cleanup_title");
                Assert.Equal("Session Tokens Clean Up", title);

                var dottedTitle = localizer.Get("notifications.session_cleanup_title");
                Assert.Equal("Session Tokens Clean Up", dottedTitle);

                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task TestLocalization_Russian_ReturnsCorrectText()
        {
            await ExecuteScopeAsync(sp =>
            {
                var localizer = sp.GetRequiredService<ILocalizationService>();
                CultureInfo.CurrentUICulture = new CultureInfo("ru");

                var title = localizer.Get("session_cleanup_title");
                Assert.Equal("Очистка сессионных токенов", title);

                var dottedTitle = localizer.Get("notifications.session_cleanup_title");
                Assert.Equal("Очистка сессионных токенов", dottedTitle);

                return Task.CompletedTask;
            });
        }

        [Theory]
        [InlineData("en-US", true, AppLanguage.En)]
        [InlineData("EN", true, AppLanguage.En)]
        [InlineData("en", true, AppLanguage.En)]
        [InlineData("ru-RU", true, AppLanguage.Ru)]
        [InlineData("RU", true, AppLanguage.Ru)]
        [InlineData("ru", true, AppLanguage.Ru)]
        [InlineData("fr", false, default(AppLanguage))]
        [InlineData("de-DE", false, default(AppLanguage))]
        [InlineData("", false, default(AppLanguage))]
        [InlineData("   ", false, default(AppLanguage))]
        [InlineData(null, false, default(AppLanguage))]
        public void TestLocalization_AppLanguageParsing(string? inputLanguage, bool expectedSuccess, AppLanguage expectedLanguage)
        {
            var success = AppLanguageExtensions.TryParse(inputLanguage, out var resolvedLanguage);

            Assert.Equal(expectedSuccess, success);
            Assert.Equal(expectedLanguage, resolvedLanguage);
        }

        [Theory]
        [InlineData(AppLanguage.En, "en")]
        [InlineData(AppLanguage.Ru, "ru")]
        public void TestLocalization_AppLanguageToCode(AppLanguage language, string expectedCode)
        {
            Assert.Equal(expectedCode, language.ToCode());
        }

        [Fact]
        public async Task TestLocalization_ArgumentsFormatting()
        {
            await ExecuteScopeAsync(sp =>
            {
                var localizer = sp.GetRequiredService<ILocalizationService>();

                CultureInfo.CurrentUICulture = new CultureInfo("en");
                var enMessage = localizer.Get("session_cleanup_message", 42);
                Assert.Equal("Removed 42 expired or revoked tokens.", enMessage);

                CultureInfo.CurrentUICulture = new CultureInfo("ru");
                var ruMessage = localizer.Get("session_cleanup_message", 42);
                Assert.Equal("Удалено устаревших или отозванных токенов: 42.", ruMessage);

                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task TestLocalization_FallbackToEnglish_WhenCultureIsUnsupported()
        {
            await ExecuteScopeAsync(sp =>
            {
                var localizer = sp.GetRequiredService<ILocalizationService>();

                // A key that exists in English should fall back to English if current culture is unsupported
                CultureInfo.CurrentUICulture = new CultureInfo("de-DE");
                var text = localizer.Get("session_cleanup_title");
                Assert.Equal("Session Tokens Clean Up", text);

                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task TestLocalization_FallbackToKey_WhenKeyMissingInAllLanguages()
        {
            await ExecuteScopeAsync(sp =>
            {
                var localizer = sp.GetRequiredService<ILocalizationService>();

                var missingKey = "non_existent_key_12345";
                var result = localizer.Get(missingKey);
                Assert.Equal(missingKey, result);

                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task TestLocalization_UninitializedCulture_ThrowsInvalidOperationException()
        {
            await ExecuteScopeAsync(sp =>
            {
                var localizer = sp.GetRequiredService<ILocalizationService>();
                CultureInfo.CurrentUICulture = CultureInfo.InvariantCulture;

                var exception = Assert.Throws<InvalidOperationException>(() => localizer.Get("notifications.session_cleanup_title"));
                Assert.Contains("Localization culture has not been initialized", exception.Message);

                return Task.CompletedTask;
            });
        }
    }
}
