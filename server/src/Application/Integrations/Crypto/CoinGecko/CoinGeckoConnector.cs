using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Crypto.Model;
using Audex.Application.Interfaces.Integrations.Crypto;
using Microsoft.Extensions.Logging;

namespace Audex.Application.Integrations.Crypto.CoinGecko
{
    public class CoinGeckoConnector : ICryptoConnector
    {
        private readonly CoinGeckoApiClient _apiClient;
        private readonly ILogger<CoinGeckoConnector> _logger;

        public CoinGeckoConnector(
            CoinGeckoApiClient apiClient,
            ILogger<CoinGeckoConnector> logger)
        {
            _apiClient = apiClient;
            _logger = logger;
        }

        public async Task<IEnumerable<CryptoMarketDataRow>> GetPricesAsync(
            IEnumerable<CryptocurrencyDto> cryptocurrencies,
            CancellationToken cancellationToken = default)
        {
            var cryptoList = cryptocurrencies?.Where(c => c != null && !string.IsNullOrWhiteSpace(c.Name)).ToList();
            if (cryptoList == null || cryptoList.Count == 0)
            {
                return Enumerable.Empty<CryptoMarketDataRow>();
            }

            var names = cryptoList.Select(c => c.Name).Distinct();
            var pricesByName = await _apiClient.GetPricesInUsdAsync(names, cancellationToken);

            var result = new List<CryptoMarketDataRow>();
            var now = DateTime.UtcNow;

            foreach (var crypto in cryptoList)
            {
                if (pricesByName.TryGetValue(crypto.Name, out var priceUsd))
                {
                    result.Add(new CryptoMarketDataRow
                    {
                        CryptocurrencyId = crypto.Id,
                        Symbol = crypto.Symbol,
                        PriceUsd = priceUsd,
                        Date = now
                    });
                }
            }

            return result;
        }

        public async Task<(string Name, decimal PriceUsd)?> GetCoinInfoBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return null;
            }

            return await _apiClient.GetCoinBySymbolAsync(symbol, cancellationToken);
        }
    }
}
