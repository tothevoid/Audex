#nullable enable
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Interfaces.Integrations.Oil;

namespace Audex.Tests.Shared.Mock
{
    public class MockYahooFinanceApiClient : IYahooFinanceApiClient
    {
        public Func<IEnumerable<string>, CancellationToken, Task<string?>>? GetQuotesJsonHandler { get; set; }
        public Func<string, CancellationToken, Task<string?>>? GetChartJsonHandler { get; set; }

        public int QuotesCallCount { get; private set; }
        public int ChartCallCount { get; private set; }

        public Task<string?> GetQuotesJsonAsync(IEnumerable<string> tickers, CancellationToken cancellationToken = default)
        {
            QuotesCallCount++;
            if (GetQuotesJsonHandler != null)
            {
                return GetQuotesJsonHandler(tickers, cancellationToken);
            }

            return Task.FromResult<string?>(null);
        }

        public Task<string?> GetChartJsonAsync(string ticker, CancellationToken cancellationToken = default)
        {
            ChartCallCount++;
            if (GetChartJsonHandler != null)
            {
                return GetChartJsonHandler(ticker, cancellationToken);
            }

            return Task.FromResult<string?>(null);
        }
    }
}
