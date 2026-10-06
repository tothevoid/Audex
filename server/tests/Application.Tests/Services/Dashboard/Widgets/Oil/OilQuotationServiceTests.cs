#nullable enable
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Services.Dashboard.Widgets.Oil;
using Audex.Tests.Shared.Mock;
using Xunit;

namespace Audex.Application.Tests.Services.Dashboard.Widgets.Oil
{
    public class OilQuotationServiceTests
    {
        private readonly MockOilConnector _yahooOilConnector;
        private readonly MockOilConnector _moexOilConnector;
        private readonly OilQuotationService _oilQuotationService;

        public OilQuotationServiceTests()
        {
            _yahooOilConnector = new MockOilConnector();
            _moexOilConnector = new MockOilConnector();
            _oilQuotationService = new OilQuotationService(_yahooOilConnector, _moexOilConnector);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WithKnownSymbols_QueriesPrimaryYahooProvider()
        {
            var requestedSymbols = new List<string> { "BRENT", "WTI" };

            _yahooOilConnector.GetOilQuotesHandler = symbols =>
            {
                return Task.FromResult<IEnumerable<OilQuoteDto>>(new List<OilQuoteDto>
                {
                    new()
                    {
                        Symbol = "BZ=F",
                        Price = 75.50m,
                        Currency = "USD",
                        Source = "Yahoo Finance"
                    },
                    new()
                    {
                        Symbol = "CL=F",
                        Price = 71.20m,
                        Currency = "USD",
                        Source = "Yahoo Finance"
                    }
                });
            };

            var result = (await _oilQuotationService.GetOilQuotesAsync(requestedSymbols)).ToList();

            Assert.Equal(2, result.Count);
            Assert.Equal("BRENT", result[0].Symbol);
            Assert.Equal(75.50m, result[0].Price);
            Assert.Equal("WTI", result[1].Symbol);
            Assert.Equal(71.20m, result[1].Price);
            Assert.Equal(1, _yahooOilConnector.CallCount);
            Assert.Equal(0, _moexOilConnector.CallCount);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WithUnknownOrUnsupportedDerivatives_IgnoresThem()
        {
            var requestedSymbols = new List<string> { "URALS", "ESPO", "UNKNOWN_GRADE" };

            var result = (await _oilQuotationService.GetOilQuotesAsync(requestedSymbols)).ToList();

            Assert.Empty(result);
            Assert.Equal(0, _yahooOilConnector.CallCount);
            Assert.Equal(0, _moexOilConnector.CallCount);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WhenYahooFails_FallsBackToMoexForSupportedBenchmarks()
        {
            var requestedSymbols = new List<string> { "BRENT" };

            _yahooOilConnector.GetOilQuotesHandler = _ => Task.FromResult<IEnumerable<OilQuoteDto>>(new List<OilQuoteDto>());

            _moexOilConnector.GetOilQuotesHandler = symbols =>
            {
                return Task.FromResult<IEnumerable<OilQuoteDto>>(new List<OilQuoteDto>
                {
                    new()
                    {
                        Symbol = "BR",
                        Price = 74.80m,
                        Currency = "USD",
                        Source = "MOEX"
                    }
                });
            };

            var result = (await _oilQuotationService.GetOilQuotesAsync(requestedSymbols)).ToList();

            Assert.Single(result);
            Assert.Equal("BRENT", result[0].Symbol);
            Assert.Equal(74.80m, result[0].Price);
            Assert.Equal(1, _yahooOilConnector.CallCount);
            Assert.Equal(1, _moexOilConnector.CallCount);
        }

        [Fact]
        public async Task GetOilQuotesAsync_WhenProviderReturnsQuoteWithEmptySource_ThrowsInvalidOperationException()
        {
            var requestedSymbols = new List<string> { "BRENT" };

            _yahooOilConnector.GetOilQuotesHandler = symbols =>
            {
                return Task.FromResult<IEnumerable<OilQuoteDto>>(new List<OilQuoteDto>
                {
                    new()
                    {
                        Symbol = "BZ=F",
                        Price = 75.50m,
                        Currency = "USD",
                        Source = ""
                    }
                });
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _oilQuotationService.GetOilQuotesAsync(requestedSymbols));
        }

        [Fact]
        public async Task GetSupportedSymbolsAsync_ReturnsConfiguredBenchmarkSymbols()
        {
            var symbols = await _oilQuotationService.GetSupportedSymbolsAsync();

            Assert.Equal(2, symbols.Count);
            Assert.Contains("BRENT", symbols);
            Assert.Contains("WTI", symbols);
        }
    }
}
