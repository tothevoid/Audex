#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Interfaces.Integrations.Oil;
using Microsoft.Extensions.Logging;

namespace Audex.Application.Integrations.Oil.Yahoo
{
    public class YahooFinanceApiClient : IYahooFinanceApiClient
    {
        private const string UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

        private readonly ILogger<YahooFinanceApiClient> _logger;
        private readonly SemaphoreSlim _sessionLock = new(1, 1);
        private string? _cachedCrumb;
        private DateTime _crumbExpiresAt = DateTime.MinValue;
        private CookieContainer _cookieContainer = new();
        private HttpClient? _authenticatedClient;

        public YahooFinanceApiClient(ILogger<YahooFinanceApiClient> logger)
        {
            _logger = logger;
        }

        public async Task<string?> GetQuotesJsonAsync(IEnumerable<string> tickers, CancellationToken cancellationToken = default)
        {
            var tickerList = tickers.ToList();
            if (tickerList.Count == 0)
            {
                return null;
            }

            var client = await GetOrCreateAuthenticatedClientAsync(cancellationToken);
            if (string.IsNullOrEmpty(_cachedCrumb))
            {
                return null;
            }

            try
            {
                var tickersQuery = string.Join(",", tickerList);
                var quoteUrl = $"https://query2.finance.yahoo.com/v7/finance/quote?symbols={Uri.EscapeDataString(tickersQuery)}&crumb={Uri.EscapeDataString(_cachedCrumb)}";
                using var request = CreateGetRequest(quoteUrl);

                var response = await client.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Yahoo Finance batch quotes request returned HTTP {StatusCode} for tickers: {Tickers}", response.StatusCode, string.Join(",", tickerList));
                    return null;
                }

                return await response.Content.ReadAsStringAsync(cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Failed to fetch Yahoo Finance batch quotes for tickers: {Tickers}", string.Join(",", tickerList));
                return null;
            }
        }

        public async Task<string?> GetChartJsonAsync(string ticker, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(ticker))
            {
                return null;
            }

            try
            {
                var client = await GetOrCreateAuthenticatedClientAsync(cancellationToken);
                var chartUrl = BuildChartUrl(ticker);
                using var request = CreateGetRequest(chartUrl);

                var response = await client.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Yahoo Finance chart request returned HTTP {StatusCode} for ticker: {Ticker}", response.StatusCode, ticker);
                    return null;
                }

                return await response.Content.ReadAsStringAsync(cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Failed to fetch Yahoo Finance chart data for ticker: {Ticker}", ticker);
                return null;
            }
        }

        private string BuildChartUrl(string ticker)
        {
            var chartUrl = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(ticker)}?interval=1d&range=1d";
            if (!string.IsNullOrEmpty(_cachedCrumb))
            {
                chartUrl += $"&crumb={Uri.EscapeDataString(_cachedCrumb)}";
            }

            return chartUrl;
        }

        private static HttpRequestMessage CreateGetRequest(string requestUrl)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
            request.Headers.Add("User-Agent", UserAgent);
            return request;
        }

        private async Task<HttpClient> GetOrCreateAuthenticatedClientAsync(CancellationToken cancellationToken)
        {
            if (IsSessionValid())
            {
                return _authenticatedClient!;
            }

            await _sessionLock.WaitAsync(cancellationToken);
            try
            {
                if (IsSessionValid())
                {
                    return _authenticatedClient!;
                }

                _authenticatedClient = CreateConfiguredHttpClient();
                await InitializeSessionCookiesAsync(_authenticatedClient, cancellationToken);

                var crumb = await FetchCrumbAsync(_authenticatedClient, cancellationToken);
                if (!string.IsNullOrEmpty(crumb))
                {
                    _cachedCrumb = crumb;
                    _crumbExpiresAt = DateTime.UtcNow.AddHours(6);
                }

                return _authenticatedClient;
            }
            finally
            {
                _sessionLock.Release();
            }
        }

        private bool IsSessionValid()
        {
            return _authenticatedClient != null && !string.IsNullOrEmpty(_cachedCrumb) && DateTime.UtcNow < _crumbExpiresAt;
        }

        private HttpClient CreateConfiguredHttpClient()
        {
            _cookieContainer = new CookieContainer();
            var handler = new HttpClientHandler
            {
                CookieContainer = _cookieContainer,
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
            };

            return new HttpClient(handler)
            {
                Timeout = TimeSpan.FromSeconds(15)
            };
        }

        private async Task InitializeSessionCookiesAsync(HttpClient client, CancellationToken cancellationToken)
        {
            try
            {
                using var cookieRequest = CreateGetRequest("https://fc.yahoo.com");
                await client.SendAsync(cookieRequest, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Failed to initialize session cookies from Yahoo Finance");
            }
        }

        private async Task<string?> FetchCrumbAsync(HttpClient client, CancellationToken cancellationToken)
        {
            try
            {
                using var crumbRequest = CreateGetRequest("https://query2.finance.yahoo.com/v1/test/getcrumb");
                var crumbResponse = await client.SendAsync(crumbRequest, cancellationToken);
                if (!crumbResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Yahoo Finance getcrumb request returned HTTP {StatusCode}", crumbResponse.StatusCode);
                    return null;
                }

                var crumb = await crumbResponse.Content.ReadAsStringAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(crumb) || crumb.Contains("Too Many Requests", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Yahoo Finance getcrumb response is empty or rate-limited: {CrumbResponse}", crumb);
                    return null;
                }

                return crumb.Trim();
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Failed to fetch session crumb from Yahoo Finance");
                return null;
            }
        }
    }
}
