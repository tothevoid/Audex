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
            var handler = new MockHttpMessageHandler(req => new HttpResponseMessage(HttpStatusCode.OK));
            var factory = new MockHttpClientFactory(handler);
            var apiClient = new CoinGeckoApiClient(factory, NullLogger<CoinGeckoApiClient>.Instance);
            var connector = new CoinGeckoConnector(apiClient, NullLogger<CoinGeckoConnector>.Instance);

            var result = await connector.GetPricesAsync(new List<CryptocurrencyDto>());

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetPricesAsync_FullPipeline_FetchesPricesByName()
        {
            var btcId = Guid.NewGuid();
            var ethId = Guid.NewGuid();

            var handler = new MockHttpMessageHandler(req =>
            {
                var uri = req.RequestUri!.ToString();
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
            var apiClient = new CoinGeckoApiClient(factory, NullLogger<CoinGeckoApiClient>.Instance);
            var connector = new CoinGeckoConnector(apiClient, NullLogger<CoinGeckoConnector>.Instance);

            var cryptos = new List<CryptocurrencyDto>
            {
                new() { Id = btcId, Name = "Bitcoin", Symbol = "BTC" },
                new() { Id = ethId, Name = "Ethereum", Symbol = "ETH" }
            };

            var prices = (await connector.GetPricesAsync(cryptos)).ToList();

            Assert.Equal(2, prices.Count);
            var btcPrice = prices.FirstOrDefault(p => p.CryptocurrencyId == btcId);
            Assert.NotNull(btcPrice);
            Assert.Equal(68500.50m, btcPrice.PriceUsd);
            Assert.Equal("BTC", btcPrice.Symbol);

            var ethPrice = prices.FirstOrDefault(p => p.CryptocurrencyId == ethId);
            Assert.NotNull(ethPrice);
            Assert.Equal(3450.25m, ethPrice.PriceUsd);
            Assert.Equal("ETH", ethPrice.Symbol);
        }

        [Fact]
        public async Task GetCoinInfoBySymbolAsync_ResolvesNameAndPrice()
        {
            var handler = new MockHttpMessageHandler(req =>
            {
                var uri = req.RequestUri!.ToString();
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
            var apiClient = new CoinGeckoApiClient(factory, NullLogger<CoinGeckoApiClient>.Instance);
            var connector = new CoinGeckoConnector(apiClient, NullLogger<CoinGeckoConnector>.Instance);

            var info = await connector.GetCoinInfoBySymbolAsync("btc");

            Assert.NotNull(info);
            Assert.Equal("Bitcoin", info.Value.Name);
            Assert.Equal(68500.50m, info.Value.PriceUsd);
        }

        [Fact]
        public async Task GetCoinInfoBySymbolAsync_NotFound_ReturnsNull()
        {
            var handler = new MockHttpMessageHandler(req =>
            {
                var uri = req.RequestUri!.ToString();
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
            var apiClient = new CoinGeckoApiClient(factory, NullLogger<CoinGeckoApiClient>.Instance);
            var connector = new CoinGeckoConnector(apiClient, NullLogger<CoinGeckoConnector>.Instance);

            var info = await connector.GetCoinInfoBySymbolAsync("UNKNOWNXYZ");

            Assert.Null(info);
        }
    }
}
