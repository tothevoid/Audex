using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Crypto.CoinGecko;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Audex.Application.Tests.Integrations.Crypto
{
    public class CoinGeckoConnectorTests
    {
        private class MockHttpMessageHandler : HttpMessageHandler
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

            public MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
            {
                _handler = handler;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(_handler(request));
            }
        }

        private class MockHttpClientFactory : IHttpClientFactory
        {
            private readonly HttpMessageHandler _handler;

            public MockHttpClientFactory(HttpMessageHandler handler)
            {
                _handler = handler;
            }

            public HttpClient CreateClient(string name = "")
            {
                return new HttpClient(_handler);
            }
        }

        private const string FakeMarketsJson = "[" +
            "{\"id\":\"bitcoin\",\"symbol\":\"btc\",\"name\":\"Bitcoin\",\"current_price\":68500.50,\"market_cap\":1300000000000}," +
            "{\"id\":\"ethereum\",\"symbol\":\"eth\",\"name\":\"Ethereum\",\"current_price\":3450.25,\"market_cap\":400000000000}" +
            "]";

        private const string FakePricesJson = "{\"bitcoin\":{\"usd\":68500.50},\"ethereum\":{\"usd\":3450.25}}";

        [Fact]
        public async Task GetPricesAsync_EmptyList_ReturnsEmpty()
        {
            var handler = new MockHttpMessageHandler(request => new HttpResponseMessage(HttpStatusCode.OK));
            var factory = new MockHttpClientFactory(handler);
            var connector = new CoinGeckoConnector(factory, NullLogger<CoinGeckoConnector>.Instance);

            var result = await connector.GetPricesAsync(new List<CryptocurrencyDto>());

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Empty(result.Data);
        }

        [Fact]
        public async Task GetPricesAsync_ProviderError_ReturnsProviderUnavailable()
        {
            var handler = new MockHttpMessageHandler(request => new HttpResponseMessage(HttpStatusCode.InternalServerError));
            var factory = new MockHttpClientFactory(handler);
            var connector = new CoinGeckoConnector(factory, NullLogger<CoinGeckoConnector>.Instance);

            var cryptos = new List<CryptocurrencyDto>
            {
                new() { Id = Guid.NewGuid(), Name = "Bitcoin", Symbol = "BTC" }
            };

            var pullResult = await connector.GetPricesAsync(cryptos);

            Assert.False(pullResult.IsSuccess);
            Assert.Null(pullResult.Data);
        }

        [Fact]
        public async Task GetPricesAsync_FullPipeline_FetchesPricesByName()
        {
            var btcId = Guid.NewGuid();
            var ethId = Guid.NewGuid();

            var handler = new MockHttpMessageHandler(request =>
            {
                var uri = request.RequestUri!.ToString();
                if (uri.Contains("simple/price"))
                {
                    Assert.Contains("bitcoin", uri);
                    Assert.Contains("ethereum", uri);
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(FakePricesJson, Encoding.UTF8, "application/json")
                    };
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            var factory = new MockHttpClientFactory(handler);
            var connector = new CoinGeckoConnector(factory, NullLogger<CoinGeckoConnector>.Instance);

            var cryptos = new List<CryptocurrencyDto>
            {
                new() { Id = btcId, Name = "Bitcoin", Symbol = "BTC" },
                new() { Id = ethId, Name = "Ethereum", Symbol = "ETH" }
            };

            var pullResult = await connector.GetPricesAsync(cryptos);

            Assert.True(pullResult.IsSuccess);
            Assert.NotNull(pullResult.Data);
            var prices = pullResult.Data;
            Assert.Equal(2, prices.Count);
            var btcPrice = prices.FirstOrDefault(priceRow => priceRow.CryptocurrencyId == btcId);
            Assert.NotNull(btcPrice);
            Assert.Equal(68500.50m, btcPrice.PriceUsd);
            Assert.Equal("BTC", btcPrice.Symbol);

            var ethPrice = prices.FirstOrDefault(priceRow => priceRow.CryptocurrencyId == ethId);
            Assert.NotNull(ethPrice);
            Assert.Equal(3450.25m, ethPrice.PriceUsd);
            Assert.Equal("ETH", ethPrice.Symbol);
        }

        [Fact]
        public async Task GetCoinBySymbolAsync_ResolvesNameAndPrice()
        {
            var handler = new MockHttpMessageHandler(request =>
            {
                var uri = request.RequestUri!.ToString();
                if (uri.Contains("coins/markets"))
                {
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(FakeMarketsJson, Encoding.UTF8, "application/json")
                    };
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            var factory = new MockHttpClientFactory(handler);
            var connector = new CoinGeckoConnector(factory, NullLogger<CoinGeckoConnector>.Instance);

            var response = await connector.GetCoinBySymbolAsync("btc");

            Assert.True(response.IsSuccess);
            Assert.NotNull(response.Data);
            Assert.Equal("Bitcoin", response.Data.Name);
            Assert.Equal(68500.50m, response.Data.PriceUsd);
        }

        [Fact]
        public async Task GetCoinBySymbolAsync_NotFound_ReturnsNotFoundResponse()
        {
            var handler = new MockHttpMessageHandler(request =>
            {
                var uri = request.RequestUri!.ToString();
                if (uri.Contains("coins/markets"))
                {
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("[]", Encoding.UTF8, "application/json")
                    };
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            var factory = new MockHttpClientFactory(handler);
            var connector = new CoinGeckoConnector(factory, NullLogger<CoinGeckoConnector>.Instance);

            var response = await connector.GetCoinBySymbolAsync("UNKNOWNXYZ");

            Assert.False(response.IsSuccess);
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            Assert.Null(response.Data);
        }

        [Fact]
        public async Task GetCoinBySymbolAsync_PriceZeroAndFallbackFails_ReturnsFailure()
        {
            const string marketsWithZeroPriceJson = "[{\"id\":\"custom-coin\",\"symbol\":\"custom\",\"name\":\"Custom Coin\",\"current_price\":0.0,\"market_cap\":0}]";

            var handler = new MockHttpMessageHandler(request =>
            {
                var uri = request.RequestUri!.ToString();
                if (uri.Contains("coins/markets"))
                {
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(marketsWithZeroPriceJson, Encoding.UTF8, "application/json")
                    };
                }

                if (uri.Contains("simple/price"))
                {
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            var factory = new MockHttpClientFactory(handler);
            var connector = new CoinGeckoConnector(factory, NullLogger<CoinGeckoConnector>.Instance);

            var response = await connector.GetCoinBySymbolAsync("custom");

            Assert.False(response.IsSuccess);
            Assert.Null(response.Data);
        }
    }
}
