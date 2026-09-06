using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Integrations.Crypto.CoinGecko.Models;
using Microsoft.Extensions.Logging;

namespace Audex.Application.Integrations.Crypto.CoinGecko
{
    public class CoinGeckoApiClient
    {
        private const string BaseApiUrl = "https://api.coingecko.com/api/v3";
        private const string UserAgent = "Audex/1.0";

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<CoinGeckoApiClient> _logger;

        public CoinGeckoApiClient(
            IHttpClientFactory httpClientFactory,
            ILogger<CoinGeckoApiClient> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<(string Name, decimal PriceUsd)?> GetCoinBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return null;
            }

            try
            {
                var client = CreateHttpClient();
                var trimmed = symbol.Trim();
                var url = $"{BaseApiUrl}/coins/markets?vs_currency=usd&symbols={Uri.EscapeDataString(trimmed)}&include_tokens=all";

                var response = await client.GetAsync(url, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch coin by symbol '{Symbol}' from CoinGecko. Status code: {StatusCode}", symbol, response.StatusCode);
                    return null;
                }

                var items = await response.Content.ReadFromJsonAsync<List<CoinGeckoCoinListItem>>(cancellationToken: cancellationToken);
                if (items == null || items.Count == 0)
                {
                    return null;
                }

                var match = items
                    .Where(c => string.Equals(c.Symbol, trimmed, StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(c.Id, trimmed, StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(c.Name, trimmed, StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(c => c.MarketCap ?? 0)
                    .FirstOrDefault() ?? items[0];

                var price = match.CurrentPrice ?? 0m;
                if (price == 0m)
                {
                    var prices = await GetPricesInUsdAsync(new[] { match.Id }, cancellationToken);
                    if (prices.TryGetValue(match.Id, out var p))
                    {
                        price = p;
                    }
                }

                return (match.Name, price);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching coin by symbol '{Symbol}' from CoinGecko: {Message}", symbol, ex.Message);
                return null;
            }
        }

        public async Task<Dictionary<string, decimal>> GetPricesInUsdAsync(IEnumerable<string> coinIds, CancellationToken cancellationToken = default)
        {
            var result = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var idList = coinIds?
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();

            if (idList == null || idList.Count == 0)
            {
                return result;
            }

            try
            {
                var client = CreateHttpClient();
                var idsParam = string.Join(",", idList.Select(Uri.EscapeDataString));
                var url = $"{BaseApiUrl}/simple/price?ids={idsParam}&vs_currencies=usd";

                var response = await client.GetAsync(url, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("CoinGecko /simple/price request failed with status {StatusCode}.", response.StatusCode);
                    return result;
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);

                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    var coinId = prop.Name;
                    if (prop.Value.TryGetProperty("usd", out var usdProp) && usdProp.TryGetDecimal(out var price))
                    {
                        result[coinId] = price;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching prices from CoinGecko: {Message}", ex.Message);
            }

            return result;
        }

        private HttpClient CreateHttpClient()
        {
            var client = _httpClientFactory.CreateClient();
            if (!client.DefaultRequestHeaders.Contains("User-Agent"))
            {
                client.DefaultRequestHeaders.Add("User-Agent", UserAgent);
            }
            return client;
        }
    }
}
