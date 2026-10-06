#nullable enable
using System;

namespace Audex.Application.Utilities
{
    public static class FinancialUtilities
    {
        public static decimal CalculatePrice(decimal? lastPrice, decimal? previousPrice, decimal defaultPrice = 0m)
        {
            return (lastPrice.HasValue && lastPrice.Value > 0)
                ? lastPrice.Value
                : (previousPrice ?? defaultPrice);
        }

        public static decimal CalculateChange(decimal? lastPrice, decimal? previousPrice, decimal? explicitChange = null)
        {
            if (explicitChange.HasValue)
            {
                return explicitChange.Value;
            }

            return (lastPrice.HasValue && previousPrice.HasValue)
                ? lastPrice.Value - previousPrice.Value
                : 0m;
        }

        public static decimal CalculateChangePercent(
            decimal? lastPrice,
            decimal? previousPrice,
            decimal? explicitChangePercent = null,
            int decimals = 2)
        {
            if (explicitChangePercent.HasValue)
            {
                return explicitChangePercent.Value;
            }

            if (lastPrice.HasValue && previousPrice.HasValue && previousPrice.Value > 0)
            {
                return Math.Round((lastPrice.Value - previousPrice.Value) / previousPrice.Value * 100, decimals);
            }

            return 0m;
        }
    }
}
