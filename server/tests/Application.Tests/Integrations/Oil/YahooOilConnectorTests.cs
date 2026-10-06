#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.Integrations.Oil.Yahoo;
using Audex.Tests.Shared.Mock;
using Xunit;

namespace Audex.Application.Tests.Integrations.Oil
{
    public class YahooOilConnectorTests
    {
        private readonly MockYahooFinanceApiClient _mockApiClient;
        private readonly YahooOilConnector _connector;

        public YahooOilConnectorTests()
        {
            _mockApiClient = new MockYahooFinanceApiClient();
            _connector = new YahooOilConnector(_mockApiClient);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WithNullOrEmptySymbols_ReturnsEmptyListWithoutCallingApi()
        {
            var emptyResult = await _connector.GetOilQuotesAsync(Enumerable.Empty<string>());
            var nullResult = await _connector.GetOilQuotesAsync(null!);

            Assert.Empty(emptyResult);
            Assert.Empty(nullResult);
            Assert.Equal(0, _mockApiClient.QuotesCallCount);
            Assert.Equal(0, _mockApiClient.ChartCallCount);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WithValidBatchQuotes_ParsesAndReturnsQuotesCorrectly()
        {
            const string sampleBatchJson = """
            {
                "quoteResponse": {
                    "result": [
                        {
                            "symbol": "BZ=F",
                            "regularMarketPrice": 75.5,
                            "regularMarketChange": -1.2,
                            "regularMarketChangePercent": -1.56,
                            "regularMarketTime": 1704067200,
                            "currency": "USD"
                        },
                        {
                            "symbol": "CL=F",
                            "regularMarketPrice": 70.25,
                            "regularMarketChange": 0.8,
                            "regularMarketChangePercent": 1.15,
                            "regularMarketTime": 1704067200,
                            "currency": "USD"
                        }
                    ]
                }
            }
            """;

            _mockApiClient.GetQuotesJsonHandler = (tickers, cancellationToken) =>
                Task.FromResult<string?>(sampleBatchJson);

            var quotes = (await _connector.GetOilQuotesAsync(new[] { "BZ=F", "CL=F" })).ToList();

            Assert.Equal(2, quotes.Count);
            Assert.Equal("BZ=F", quotes[0].Symbol);
            Assert.Equal(75.5m, quotes[0].Price);
            Assert.Equal(-1.2m, quotes[0].Change);
            Assert.Equal(-1.56m, quotes[0].ChangePercent);
            Assert.Equal("USD", quotes[0].Currency);
            Assert.Equal("Yahoo Finance", quotes[0].Source);

            Assert.Equal("CL=F", quotes[1].Symbol);
            Assert.Equal(70.25m, quotes[1].Price);
            Assert.Equal(0.8m, quotes[1].Change);
            Assert.Equal(1.15m, quotes[1].ChangePercent);

            Assert.Equal(1, _mockApiClient.QuotesCallCount);
            Assert.Equal(0, _mockApiClient.ChartCallCount);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WhenBatchQuoteReturnsNullOrEmpty_FallsBackToChartEndpoint()
        {
            const string sampleChartJson = """
            {
                "chart": {
                    "result": [
                        {
                            "meta": {
                                "symbol": "BZ=F",
                                "regularMarketPrice": 80.0,
                                "previousClose": 78.0,
                                "currency": "USD",
                                "regularMarketTime": 1704067200
                            }
                        }
                    ]
                }
            }
            """;

            _mockApiClient.GetQuotesJsonHandler = (tickers, cancellationToken) =>
                Task.FromResult<string?>(null);

            _mockApiClient.GetChartJsonHandler = (ticker, cancellationToken) =>
                Task.FromResult<string?>(ticker == "BZ=F" ? sampleChartJson : null);

            var quotes = (await _connector.GetOilQuotesAsync(new[] { "BZ=F" })).ToList();

            Assert.Single(quotes);
            Assert.Equal("BZ=F", quotes[0].Symbol);
            Assert.Equal(80.0m, quotes[0].Price);
            Assert.Equal(2.0m, quotes[0].Change);
            Assert.Equal(2.56m, quotes[0].ChangePercent); // (2.0 / 78.0) * 100 = 2.5641... rounded to 2.56
            Assert.Equal("USD", quotes[0].Currency);
            Assert.Equal("Yahoo Finance", quotes[0].Source);

            Assert.Equal(1, _mockApiClient.QuotesCallCount);
            Assert.Equal(1, _mockApiClient.ChartCallCount);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WhenBothBatchAndChartFail_ReturnsEmptyList()
        {
            _mockApiClient.GetQuotesJsonHandler = (tickers, cancellationToken) =>
                Task.FromResult<string?>(null);

            _mockApiClient.GetChartJsonHandler = (ticker, cancellationToken) =>
                Task.FromResult<string?>(null);

            var quotes = await _connector.GetOilQuotesAsync(new[] { "UNKNOWN=F" });

            Assert.Empty(quotes);
            Assert.Equal(1, _mockApiClient.QuotesCallCount);
            Assert.Equal(1, _mockApiClient.ChartCallCount);
        }
    }
}
