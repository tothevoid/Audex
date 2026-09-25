#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Securities;
using Audex.Application.Integrations.Stock;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Interfaces.Integrations.Stock;

namespace Audex.Tests.Shared.Mock
{
    public class MockStockConnector : IStockConnector
    {
        public Dictionary<string, MarketSecurityInfoDto> Securities { get; } = new(StringComparer.OrdinalIgnoreCase);

        public Func<string, Task<MarketSecurityInfoDto?>>? FindSecurityInfoHandler { get; set; }
        public Func<IEnumerable<SecurityDto>, Task<IEnumerable<MarketDataRow>>>? GetValuesByTickersHandler { get; set; }

        public int FindCallsCount { get; private set; }

        public Task<IEnumerable<MarketDataRow>> GetValuesByTickersAsync(IEnumerable<SecurityDto> tickers)
        {
            if (GetValuesByTickersHandler != null)
            {
                return GetValuesByTickersHandler(tickers);
            }

            return Task.FromResult(Enumerable.Empty<MarketDataRow>());
        }

        public Task<IEnumerable<SecurityHistoryValueDto>> GetTickerHistoryAsync(SecurityDto security, DateOnly from, DateOnly to, int interval = 24) =>
            Task.FromResult(Enumerable.Empty<SecurityHistoryValueDto>());

        public Task<IEnumerable<MarketDataRow>> GetExtendedValuesByTickersAsync(IEnumerable<SecurityDto> tickers) =>
            Task.FromResult(Enumerable.Empty<MarketDataRow>());

        public Task<IEnumerable<SecurityCandleDto>> GetCandlesAsync(SecurityDto security, DateOnly from, DateOnly to, int interval = 24) =>
            Task.FromResult(Enumerable.Empty<SecurityCandleDto>());

        public Task<MarketSecurityInfoDto?> FindSecurityInfoAsync(string query)
        {
            FindCallsCount++;

            if (FindSecurityInfoHandler != null)
            {
                return FindSecurityInfoHandler(query);
            }

            if (string.IsNullOrWhiteSpace(query))
            {
                return Task.FromResult<MarketSecurityInfoDto?>(null);
            }

            var queryTrimmed = query.Trim();
            if (Securities.TryGetValue(queryTrimmed, out var securityInfo))
            {
                return Task.FromResult<MarketSecurityInfoDto?>(securityInfo);
            }

            return Task.FromResult<MarketSecurityInfoDto?>(null);
        }
    }
}
