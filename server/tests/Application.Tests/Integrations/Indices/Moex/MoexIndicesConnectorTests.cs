#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Integrations.Indices.Moex;
using Xunit;

namespace Audex.Application.Tests.Integrations.Indices.Moex
{
    public class MoexIndicesConnectorTests
    {
        [Fact]
        public async Task GetSupportedIndicesAsync_ReturnsFourMainIndices()
        {
            var httpClientFactory = new MockHttpClientFactory(new MockHttpMessageHandler("{}"));
            var connector = new MoexIndicesConnector(httpClientFactory);

            var supportedIndices = await connector.GetSupportedIndicesAsync();

            Assert.Equal(4, supportedIndices.Count);
            Assert.Contains("IMOEX", supportedIndices);
            Assert.Contains("RTSI", supportedIndices);
            Assert.Contains("RGBI", supportedIndices);
            Assert.Contains("MCFTR", supportedIndices);
        }

        [Fact]
        public async Task GetIndicesQuotesAsync_WithValidMoexResponse_ParsesQuotesCorrectly()
        {
            const string moexJsonResponse = """
            {
                "securities": {
                    "columns": ["SECID", "BOARDID", "NAME", "DECIMALS", "SHORTNAME", "CURRENCYID"],
                    "data": [
                        ["IMOEX", "SNDX", "Индекс МосБиржи", 2, "Индекс МосБиржи", "RUB"],
                        ["RTSI", "RTSI", "Индекс РТС", 2, "Индекс РТС", "USD"]
                    ]
                },
                "marketdata": {
                    "columns": ["SECID", "CURRENTVALUE", "LASTVALUE", "LASTCHANGE", "LASTCHANGEPRC", "SYSTIME"],
                    "data": [
                        ["IMOEX", 2338.21, 2328.5, 9.71, 0.42, "2026-10-07 23:50:02"],
                        ["RTSI", 861.7, 855.81, 5.89, 0.69, "2026-10-07 23:50:02"]
                    ]
                }
            }
            """;

            var httpClientFactory = new MockHttpClientFactory(new MockHttpMessageHandler(moexJsonResponse));
            var connector = new MoexIndicesConnector(httpClientFactory);

            var quotes = (await connector.GetIndicesQuotesAsync(new[] { "IMOEX", "RTSI" })).ToList();

            Assert.Equal(2, quotes.Count);

            var imoex = quotes.First(quote => quote.Code == "IMOEX");
            Assert.Equal("Индекс МосБиржи", imoex.Name);
            Assert.Equal(2338.21m, imoex.Value);
            Assert.Equal(9.71m, imoex.ChangePoints);
            Assert.Equal(0.42m, imoex.ChangePercent);
            Assert.Equal("RUB", imoex.Currency);
            Assert.Equal(2, imoex.Decimals);
            Assert.Equal("MOEX", imoex.Source);

            var rtsi = quotes.First(quote => quote.Code == "RTSI");
            Assert.Equal("Индекс РТС", rtsi.Name);
            Assert.Equal(861.7m, rtsi.Value);
            Assert.Equal(5.89m, rtsi.ChangePoints);
            Assert.Equal(0.69m, rtsi.ChangePercent);
            Assert.Equal("USD", rtsi.Currency);
        }

        [Fact]
        public async Task GetIndicesQuotesAsync_WhenHttpFails_ReturnsEmptyCollectionWithoutThrowing()
        {
            var httpClientFactory = new MockHttpClientFactory(new MockHttpMessageHandler(string.Empty, HttpStatusCode.InternalServerError));
            var connector = new MoexIndicesConnector(httpClientFactory);

            var quotes = await connector.GetIndicesQuotesAsync(new[] { "IMOEX" });

            Assert.Empty(quotes);
        }

        private sealed class MockHttpClientFactory : IHttpClientFactory
        {
            private readonly HttpMessageHandler _handler;

            public MockHttpClientFactory(HttpMessageHandler handler)
            {
                _handler = handler;
            }

            public HttpClient CreateClient(string name)
            {
                return new HttpClient(_handler);
            }
        }

        private sealed class MockHttpMessageHandler : HttpMessageHandler
        {
            private readonly string _responseContent;
            private readonly HttpStatusCode _statusCode;

            public MockHttpMessageHandler(string responseContent, HttpStatusCode statusCode = HttpStatusCode.OK)
            {
                _responseContent = responseContent;
                _statusCode = statusCode;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                var response = new HttpResponseMessage(_statusCode)
                {
                    Content = new StringContent(_responseContent, Encoding.UTF8, "application/json")
                };
                return Task.FromResult(response);
            }
        }
    }
}
