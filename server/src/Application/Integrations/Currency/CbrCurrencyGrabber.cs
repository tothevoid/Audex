using Audex.Application.Integrations.Currency.Models;
using Audex.Application.Interfaces.Integrations.Currency;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Audex.Application.Integrations.Currency
{
    public class CbrCurrencyGrabber : ICurrencyGrabber
    {
        private const string CbrBaseCurrency = "RUB";

        private readonly IHttpClientFactory _httpClientFactory;

        public CbrCurrencyGrabber(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<Dictionary<string, decimal>> GetRatesAsync(
            string mainCurrency,
            HashSet<string> requestedCurrencies,
            CancellationToken cancellationToken = default)
        {
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.GetAsync("https://www.cbr-xml-daily.ru/latest.js", cancellationToken);
            response.EnsureSuccessStatusCode();

            var currenciesInfo = await response.Content.ReadFromJsonAsync<CbrCurrencyResponse>(cancellationToken: cancellationToken);
            if (currenciesInfo?.Rates == null)
            {
                return new Dictionary<string, decimal>();
            }

            if (mainCurrency == CbrBaseCurrency)
            {
                return currenciesInfo
                    .Rates.Where(rateEntry => requestedCurrencies.Contains(rateEntry.Key))
                    .ToDictionary(rateEntry => rateEntry.Key, rateEntry => rateEntry.Value == 0 ? 0 : 1 / rateEntry.Value);
            }

            var mainCurrencyRate = currenciesInfo.Rates.FirstOrDefault(rateEntry =>
                rateEntry.Key == mainCurrency);

            if (mainCurrencyRate.Value == 0)
            {
                return new Dictionary<string, decimal>();
            }

            var rates = currenciesInfo
                .Rates.Where(rateEntry => requestedCurrencies.Contains(rateEntry.Key))
                .ToDictionary(rateEntry => rateEntry.Key, rateEntry => 
                    rateEntry.Value / mainCurrencyRate.Value);

            rates[CbrBaseCurrency] = mainCurrencyRate.Value;
            return rates;
        }
    }
}
