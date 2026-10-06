#nullable enable
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Integrations.Oil
{
    public interface IYahooFinanceApiClient
    {
        Task<string?> GetQuotesJsonAsync(IEnumerable<string> tickers, CancellationToken cancellationToken = default);

        Task<string?> GetChartJsonAsync(string ticker, CancellationToken cancellationToken = default);
    }
}
