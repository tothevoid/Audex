using Audex.Application.Utilities.Currencies;
using Xunit;

namespace Audex.Application.Tests.Utilities.Currencies
{
    public class CurrencyNormalizerTests
    {
        [Theory]
        [InlineData("RUR", "RUB")]
        [InlineData("rur", "RUB")]
        [InlineData("RuR", "RUB")]
        [InlineData("USD", "USD")]
        [InlineData("EUR", "EUR")]
        [InlineData("CNY", "CNY")]
        [InlineData("  RUB  ", "RUB")]
        [InlineData("  USD  ", "USD")]
        public void Normalize_Should_Map_Aliases_And_Trim_Currency(string inputCurrency, string expectedCurrency)
        {
            // Act
            var normalizedCurrency = CurrencyNormalizer.Normalize(inputCurrency);

            // Assert
            Assert.Equal(expectedCurrency, normalizedCurrency);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Normalize_Should_Return_Default_Currency_When_Input_Is_Empty(string? emptyInput)
        {
            // Act
            var defaultResult = CurrencyNormalizer.Normalize(emptyInput);
            var customDefaultResult = CurrencyNormalizer.Normalize(emptyInput, "USD");

            // Assert
            Assert.Equal("RUB", defaultResult);
            Assert.Equal("USD", customDefaultResult);
        }

        [Fact]
        public void Normalize_Should_Replace_Rur_Substring_When_Embedded()
        {
            // Arrange
            const string complexInput = "RUR_SETTLEMENT";

            // Act
            var normalizedCurrency = CurrencyNormalizer.Normalize(complexInput);

            // Assert
            Assert.Equal("RUB_SETTLEMENT", normalizedCurrency);
        }
    }
}
