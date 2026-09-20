using System;
using System.Collections.Generic;
using System.Linq;
using Audex.Application.DTO.Securities;
using Audex.Application.Integrations.Stock.Moex.Builders;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Integrations.Stock.Moex
{
    public static class MoexUrlFactory
    {
        public static string GetBaseSecuritiesQuery(IEnumerable<string> tickers)
        {
            return GetCommonSecuritiesBuilder(tickers)
                .Build();
        }

        public static string GetBaseCurrencySecuritiesQuery(IEnumerable<string> tickers)
        {
            return GetCommonCurrencySecuritiesBuilder(tickers)
                .Build();
        }

        public static string GetFullSecuritiesQuery(IEnumerable<string> tickers)
        {
            return GetCommonSecuritiesBuilder(tickers)
                .IncludeSecurities()
                .Build();
        }

        public static string GetFullCurrencySecuritiesQuery(IEnumerable<string> tickers)
        {
            return GetCommonCurrencySecuritiesBuilder(tickers)
                .IncludeSecurities()
                .Build();
        }

        private static MoexSecuritiesUrlBuilder GetCommonCurrencySecuritiesBuilder(IEnumerable<string> tickers)
        {
            if (tickers == null || !tickers.Any())
            {
                throw new ArgumentException("Tickers collection cannot be null or empty.", nameof(tickers));
            }

            return new MoexCurrencySecuritiesUrlBuilder()
                .IncludeMarket()
                .AddTickers(tickers);
        }

        private static MoexSecuritiesUrlBuilder GetCommonSecuritiesBuilder(IEnumerable<string> tickers)
        {
            if (tickers == null || !tickers.Any())
            {
                throw new ArgumentException("Tickers collection cannot be null or empty.", nameof(tickers));
            }

            return new MoexSecuritiesUrlBuilder()
                .IncludeMarket()
                .AddTickers(tickers);
        }

        public static string GetHistoricalQuery(SecurityDto security, DateOnly from, DateOnly to)
        {
            MoexHistoryUrlBuilder builder = security.TypeId == SecurityTypeConstants.PreciousMetal
                ? new MoexCurrencyHistoryUrlBuilder(security.Ticker)
                : new MoexHistoryUrlBuilder(security.Ticker);

            return builder
                .IncludeHistory()
                .AddRange(from, to)
                .Build();
        }

        public static string GetCandlesQuery(SecurityDto security, DateOnly from, DateOnly to, int interval = 24, int start = 0)
        {
            MoexCandlesUrlBuilder builder = security.TypeId == SecurityTypeConstants.PreciousMetal
                ? new MoexCurrencyCandlesUrlBuilder(security.Ticker)
                : new MoexCandlesUrlBuilder(security.Ticker);

            return builder
                .IncludeCandles()
                .AddInterval(interval)
                .AddRange(from, to)
                .AddStart(start)
                .Build();
        }

        public static string GetSearchSecurityQuery(string query)
        {
            return new MoexSearchSecuritiesUrlBuilder(query)
                .RemoveMeta()
                .Build();
        }
    }
}
