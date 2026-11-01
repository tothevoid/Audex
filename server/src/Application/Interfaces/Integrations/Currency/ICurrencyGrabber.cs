using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Integrations.Currency
{
    public interface ICurrencyGrabber
    {
        Task<Dictionary<string, decimal>> GetRatesAsync(
            string mainCurrency,
            HashSet<string> requestedCurrencies,
            CancellationToken cancellationToken = default);
    }
}
