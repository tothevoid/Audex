#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Integrations.Oil;
using Audex.Application.Utilities;

namespace Audex.Application.Integrations.Oil.Yahoo
{
    public class YahooOilConnector : IYahooOilConnector
    {
        private const string SourceName = "Yahoo Finance";
        private const string DefaultCurrency = "USD";

        private readonly IYahooFinanceApiClient _apiClient;

        public YahooOilConnector(IYahooFinanceApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async Task<IEnumerable<OilQuoteDto>> GetOilQuotesAsync(IEnumerable<string> oilSymbols)
        {
            if (oilSymbols == null || !oilSymbols.Any())
            {
                return Enumerable.Empty<OilQuoteDto>();
            }

            var requestedTickers = oilSymbols
                .Select(symbol => symbol.Trim().ToUpperInvariant())
                .Distinct()
                .ToList();

            if (requestedTickers.Count == 0)
            {
                return Enumerable.Empty<OilQuoteDto>();
            }

            return await FetchQuotesFromYahooAsync(requestedTickers);
        }

        private async Task<List<OilQuoteDto>> FetchQuotesFromYahooAsync(List<string> tickers)
        {
            var quotesJson = await _apiClient.GetQuotesJsonAsync(tickers);
            if (!string.IsNullOrEmpty(quotesJson))
            {
                var parsedQuotes = ParseYahooQuoteResponse(quotesJson, tickers);
                if (parsedQuotes.Count > 0)
                {
                    return parsedQuotes;
                }
            }

            return await FetchFallbackChartQuotesAsync(tickers);
        }

        private async Task<List<OilQuoteDto>> FetchFallbackChartQuotesAsync(List<string> tickers)
        {
            var results = new List<OilQuoteDto>();
            foreach (var ticker in tickers)
            {
                var chartJson = await _apiClient.GetChartJsonAsync(ticker);
                if (string.IsNullOrEmpty(chartJson))
                {
                    continue;
                }

                var quote = ParseYahooChartResponse(chartJson, ticker);
                if (quote != null)
                {
                    results.Add(quote);
                }
            }

            return results;
        }

        private static List<OilQuoteDto> ParseYahooQuoteResponse(string jsonString, List<string> requestedTickers)
        {
            var results = new List<OilQuoteDto>();
            using var document = JsonDocument.Parse(jsonString);
            if (!document.RootElement.TryGetProperty("quoteResponse", out var quoteResponse) ||
                !quoteResponse.TryGetProperty("result", out var resultsArray) ||
                resultsArray.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            var quotesByTicker = ExtractQuotesByTicker(resultsArray);
            foreach (var ticker in requestedTickers)
            {
                if (quotesByTicker.TryGetValue(ticker, out var quoteElement))
                {
                    results.Add(MapQuoteElementToDto(quoteElement, ticker));
                }
            }

            return results;
        }

        private static Dictionary<string, JsonElement> ExtractQuotesByTicker(JsonElement resultsArray)
        {
            var quotesByTicker = new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);
            foreach (var element in resultsArray.EnumerateArray())
            {
                var symbol = element.TryGetString("symbol");
                if (!string.IsNullOrEmpty(symbol))
                {
                    quotesByTicker[symbol] = element;
                }
            }

            return quotesByTicker;
        }

        private static OilQuoteDto MapQuoteElementToDto(JsonElement quoteElement, string ticker)
        {
            var price = quoteElement.GetDecimal("regularMarketPrice");
            var change = quoteElement.GetDecimal("regularMarketChange");
            var changePercent = quoteElement.GetDecimal("regularMarketChangePercent");
            var marketTime = quoteElement.GetDateTime("regularMarketTime", DateTime.UtcNow);
            var currency = quoteElement.GetString("currency", DefaultCurrency);

            return new OilQuoteDto
            {
                Symbol = ticker,
                Price = Math.Round(price, 2),
                Change = Math.Round(change, 2),
                ChangePercent = Math.Round(changePercent, 2),
                Currency = currency,
                Source = SourceName,
                LastTradeTime = marketTime
            };
        }

        private static OilQuoteDto? ParseYahooChartResponse(string jsonString, string ticker)
        {
            using var document = JsonDocument.Parse(jsonString);
            if (!document.RootElement.TryGetProperty("chart", out var chart) ||
                !chart.TryGetProperty("result", out var resultArray) ||
                resultArray.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var firstResult = resultArray.EnumerateArray().FirstOrDefault();
            if (firstResult.ValueKind != JsonValueKind.Object ||
                !firstResult.TryGetProperty("meta", out var meta))
            {
                return null;
            }

            return MapChartMetaToDto(meta, ticker);
        }

        private static OilQuoteDto MapChartMetaToDto(JsonElement meta, string ticker)
        {
            var regularMarketPrice = meta.GetDecimal("regularMarketPrice");
            var chartPreviousClose = meta.TryGetDecimal("chartPreviousClose") ?? meta.TryGetDecimal("previousClose") ?? regularMarketPrice;
            var change = regularMarketPrice - chartPreviousClose;
            var changePercent = chartPreviousClose > 0 ? (change / chartPreviousClose) * 100 : 0m;
            var marketTime = meta.GetDateTime("regularMarketTime", DateTime.UtcNow);
            var currency = meta.GetString("currency", DefaultCurrency);

            return new OilQuoteDto
            {
                Symbol = ticker,
                Price = Math.Round(regularMarketPrice, 2),
                Change = Math.Round(change, 2),
                ChangePercent = Math.Round(changePercent, 2),
                Currency = currency,
                Source = SourceName,
                LastTradeTime = marketTime
            };
        }
    }
}
