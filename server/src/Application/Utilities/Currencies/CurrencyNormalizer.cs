#nullable enable
using System;
using System.Collections.Generic;

namespace Audex.Application.Utilities.Currencies
{
    public static class CurrencyNormalizer
    {
        private static readonly Dictionary<string, string> CurrencyAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["RUR"] = "RUB"
        };

        public static string Normalize(string? currencyText, string defaultCurrency = "RUB")
        {
            if (string.IsNullOrWhiteSpace(currencyText))
            {
                return defaultCurrency;
            }

            var trimmedCurrency = currencyText.Trim();
            if (CurrencyAliases.TryGetValue(trimmedCurrency, out var mappedCurrency))
            {
                return mappedCurrency;
            }

            return trimmedCurrency.Replace("RUR", "RUB", StringComparison.OrdinalIgnoreCase);
        }
    }
}
