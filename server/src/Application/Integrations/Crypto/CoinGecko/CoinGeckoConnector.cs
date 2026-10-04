#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Common;
using Audex.Application.Integrations.Crypto.CoinGecko.Models;
using Audex.Application.Integrations.Crypto.Model;
using Audex.Application.Interfaces.Integrations.Crypto;
using Microsoft.Extensions.Logging;

namespace Audex.Application.Integrations.Crypto.CoinGecko
{
    public class CoinGeckoConnector : ICryptoConnector
    {
        private const string BaseApiUrl = "https://api.coingecko.com/api/v3";
        private const string UserAgent = "Audex/1.0";

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<CoinGeckoConnector> _logger;

        public CoinGeckoConnector(
            IHttpClientFactory httpClientFactory,
            ILogger<CoinGeckoConnector> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>> GetPricesAsync(
            IEnumerable<CryptocurrencyDto> cryptocurrencies,
            CancellationToken cancellationToken = default)
        {
            var cryptoList = cryptocurrencies
                .Where(cryptoItem => !string.IsNullOrWhiteSpace(cryptoItem.Name))
                .ToList();

            if (cryptoList.Count == 0)
            {
                return IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>.Success([]);
            }

            var pricesResponse = await FetchPricesInUsdAsync(
                cryptoList.Select(cryptoItem => cryptoItem.Name),
                cancellationToken);

            if (!pricesResponse.IsSuccess || pricesResponse.Data == null)
            {
                return IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>.Failure(
                    pricesResponse.StatusCode,
                    pricesResponse.ErrorMessage,
                    LocalizationKeys.Crypto.Errors.ProviderUnavailable);
            }

            var result = new List<CryptoMarketDataRow>();
            var now = DateTime.UtcNow;

            foreach (var crypto in cryptoList)
            {
                var normalizedName = crypto.Name.Trim().ToLowerInvariant();
                if (pricesResponse.Data.TryGetValue(normalizedName, out var priceUsd) && priceUsd > 0)
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

            return IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>.Success(result);
        }

        public async Task<IntegrationApiResponse<CryptoCoinInfo>> GetCoinBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return IntegrationApiResponse<CryptoCoinInfo>.NotFound(errorCode: LocalizationKeys.Crypto.Errors.SymbolRequired);
            }

            try
            {
                var trimmed = symbol.Trim();
                var fetchResponse = await FetchCoinsBySymbolAsync(trimmed, cancellationToken);
                if (!fetchResponse.IsSuccess)
                {
                    return IntegrationApiResponse<CryptoCoinInfo>.Failure(
                        fetchResponse.StatusCode,
                        fetchResponse.ErrorMessage,
                        LocalizationKeys.Crypto.Errors.ProviderUnavailable);
                }

                var items = fetchResponse.Data;
                if (items == null || items.Count == 0)
                {
                    return IntegrationApiResponse<CryptoCoinInfo>.NotFound(
                        errorCode: LocalizationKeys.Crypto.Errors.SymbolNotFound);
                }

                var match = FindBestMatchingCoin(items, trimmed) ?? items[0];
                if (match.CurrentPrice.HasValue && match.CurrentPrice.Value > 0m)
                {
                    return IntegrationApiResponse<CryptoCoinInfo>.Success(new CryptoCoinInfo
                    {
                        Name = match.Name,
                        PriceUsd = match.CurrentPrice.Value
                    });
                }

                var pricesResponse = await FetchPricesInUsdAsync(new[] { match.Id }, cancellationToken);
                if (pricesResponse.IsSuccess &&
                    pricesResponse.Data != null &&
                    pricesResponse.Data.TryGetValue(match.Id, out var resolvedPrice) &&
                    resolvedPrice > 0m)
                {
                    return IntegrationApiResponse<CryptoCoinInfo>.Success(new CryptoCoinInfo
                    {
                        Name = match.Name,
                        PriceUsd = resolvedPrice
                    });
                }

                _logger.LogWarning(
                    "Failed to resolve price for coin '{CoinId}' ({Symbol}) from CoinGecko. Status: {StatusCode}, Error: {Error}",
                    match.Id,
                    symbol,
                    pricesResponse.StatusCode,
                    pricesResponse.ErrorMessage);

                return IntegrationApiResponse<CryptoCoinInfo>.Failure(
                    pricesResponse.StatusCode,
                    pricesResponse.ErrorMessage,
                    LocalizationKeys.Crypto.Errors.PriceResolutionFailed);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error fetching coin by symbol '{Symbol}' from CoinGecko: {Message}", symbol, ex.Message);
                return IntegrationApiResponse<CryptoCoinInfo>.Failure(
                    null,
                    ex.Message,
                    LocalizationKeys.Crypto.Errors.ProviderUnavailable);
            }
        }

        private async Task<IntegrationApiResponse<List<CoinGeckoCoinListItem>>> FetchCoinsBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken)
        {
            var client = CreateHttpClient();
            var url = $"{BaseApiUrl}/coins/markets?vs_currency=usd&symbols={Uri.EscapeDataString(symbol)}&include_tokens=all";

            var response = await client.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to fetch coin by symbol '{Symbol}' from CoinGecko. Status code: {StatusCode}", symbol, response.StatusCode);
                return IntegrationApiResponse<List<CoinGeckoCoinListItem>>.Failure(response.StatusCode, errorContent);
            }

            var items = await response.Content.ReadFromJsonAsync<List<CoinGeckoCoinListItem>>(cancellationToken: cancellationToken);
            return IntegrationApiResponse<List<CoinGeckoCoinListItem>>.Success(items ?? []);
        }

        private async Task<IntegrationApiResponse<IReadOnlyDictionary<string, decimal>>> FetchPricesInUsdAsync(
            IEnumerable<string> coinIds,
            CancellationToken cancellationToken)
        {
            var idList = coinIds?
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();

            if (idList == null || idList.Count == 0)
            {
                return IntegrationApiResponse<IReadOnlyDictionary<string, decimal>>.Success(
                    new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase));
            }

            var client = CreateHttpClient();
            var idsParam = string.Join(",", idList.Select(Uri.EscapeDataString));
            var url = $"{BaseApiUrl}/simple/price?ids={idsParam}&vs_currencies=usd";

            var response = await client.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("CoinGecko /simple/price request failed with status {StatusCode}: {Error}", response.StatusCode, errorContent);
                return IntegrationApiResponse<IReadOnlyDictionary<string, decimal>>.Failure(response.StatusCode, errorContent);
            }

            var pricesPayload = await response.Content.ReadFromJsonAsync<Dictionary<string, Dictionary<string, decimal>>>(cancellationToken: cancellationToken);
            var result = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

            if (pricesPayload != null)
            {
                foreach (var (coinId, currencyRates) in pricesPayload)
                {
                    if (currencyRates.TryGetValue("usd", out var usdPrice) && usdPrice > 0)
                    {
                        result[coinId] = usdPrice;
                    }
                }
            }

            return IntegrationApiResponse<IReadOnlyDictionary<string, decimal>>.Success(result);
        }

        private static CoinGeckoCoinListItem? FindBestMatchingCoin(
            IEnumerable<CoinGeckoCoinListItem> coins,
            string query)
        {
            return coins
                .Where(coinItem => string.Equals(coinItem.Symbol, query, StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(coinItem.Id, query, StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(coinItem.Name, query, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(coinItem => coinItem.MarketCap ?? 0)
                .FirstOrDefault();
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
