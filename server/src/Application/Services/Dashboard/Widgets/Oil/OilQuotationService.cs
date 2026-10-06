#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Integrations.Oil;
using Audex.Application.Models.Widgets.Oil;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Audex.Application.Services.Dashboard.Widgets.Oil
{
    public class OilQuotationService : IOilConnector
    {
        public static readonly IReadOnlyList<BenchmarkConfiguration> SupportedBenchmarks =
        [
            new("BRENT", [new(OilQuoteProvider.Yahoo, "BZ=F"), new(OilQuoteProvider.Moex, "BR")]),
            new("WTI", [new(OilQuoteProvider.Yahoo, "CL=F"), new(OilQuoteProvider.Moex, "WTI")])
        ];

        public static readonly IReadOnlyDictionary<string, BenchmarkConfiguration> BenchmarkDefinitions =
            SupportedBenchmarks.ToDictionary(benchmark => benchmark.Symbol, StringComparer.OrdinalIgnoreCase);

        private readonly IYahooOilConnector _yahooOilConnector;
        private readonly IMoexOilConnector _moexOilConnector;
        private readonly ILogger<OilQuotationService> _logger;

        public OilQuotationService(
            IYahooOilConnector yahooOilConnector,
            IMoexOilConnector moexOilConnector,
            ILogger<OilQuotationService>? logger = null)
        {
            _yahooOilConnector = yahooOilConnector;
            _moexOilConnector = moexOilConnector;
            _logger = logger ?? NullLogger<OilQuotationService>.Instance;
        }

        public async Task<IEnumerable<OilQuoteDto>> GetOilQuotesAsync(IEnumerable<string>? oilSymbols = null)
        {
            var configuredBenchmarks = FilterConfiguredBenchmarks(oilSymbols);
            if (configuredBenchmarks.Count == 0)
            {
                return Enumerable.Empty<OilQuoteDto>();
            }

            var resolvedQuotes = new Dictionary<string, OilQuoteDto>(StringComparer.OrdinalIgnoreCase);
            var maxSourceIndex = configuredBenchmarks.Max(benchmark => benchmark.Sources.Count);

            for (var sourceIndex = 0; sourceIndex < maxSourceIndex; sourceIndex++)
            {
                await ResolveQuotesForSourceLevelAsync(configuredBenchmarks, resolvedQuotes, sourceIndex);

                if (resolvedQuotes.Count >= configuredBenchmarks.Count)
                {
                    break;
                }
            }

            return configuredBenchmarks
                .Where(benchmark => resolvedQuotes.ContainsKey(benchmark.Symbol))
                .Select(benchmark => resolvedQuotes[benchmark.Symbol])
                .ToList();
        }

        private static List<BenchmarkConfiguration> FilterConfiguredBenchmarks(IEnumerable<string>? oilSymbols)
        {
            var requestedSymbols = oilSymbols != null && oilSymbols.Any()
                ? oilSymbols
                : SupportedBenchmarks.Select(benchmark => benchmark.Symbol);

            return requestedSymbols
                .Where(symbol => !string.IsNullOrWhiteSpace(symbol))
                .Select(symbol => symbol.Trim().ToUpperInvariant())
                .Where(symbol => BenchmarkDefinitions.ContainsKey(symbol))
                .Select(symbol => BenchmarkDefinitions[symbol])
                .Distinct()
                .ToList();
        }

        private async Task ResolveQuotesForSourceLevelAsync(
            List<BenchmarkConfiguration> configuredBenchmarks,
            Dictionary<string, OilQuoteDto> resolvedQuotes,
            int sourceIndex)
        {
            var unresolvedBenchmarks = configuredBenchmarks
                .Where(benchmark => !resolvedQuotes.ContainsKey(benchmark.Symbol) && benchmark.Sources.Count > sourceIndex)
                .Select(benchmark => (Benchmark: benchmark, Source: benchmark.Sources[sourceIndex]))
                .GroupBy(item => item.Source.Provider);

            foreach (var providerGroup in unresolvedBenchmarks)
            {
                await FetchAndApplyProviderQuotesAsync(providerGroup.Key, providerGroup.ToList(), resolvedQuotes, sourceIndex);
            }
        }

        private async Task FetchAndApplyProviderQuotesAsync(
            OilQuoteProvider provider,
            List<(BenchmarkConfiguration Benchmark, BenchmarkSource Source)> providerItems,
            Dictionary<string, OilQuoteDto> resolvedQuotes,
            int sourceIndex)
        {
            var tickers = providerItems.Select(item => item.Source.Ticker).Distinct().ToList();

            try
            {
                var fetchedQuotes = (await FetchFromProviderAsync(provider, tickers))
                    .GroupBy(quote => quote.Symbol, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

                foreach (var (benchmark, source) in providerItems)
                {
                    if (resolvedQuotes.ContainsKey(benchmark.Symbol))
                    {
                        continue;
                    }

                    if (fetchedQuotes.TryGetValue(source.Ticker, out var quote) && quote.Price > 0)
                    {
                        if (string.IsNullOrWhiteSpace(quote.Source))
                        {
                            throw new InvalidOperationException(
                                $"Provider '{source.Provider}' returned quotation for ticker '{source.Ticker}' with empty Source.");
                        }

                        resolvedQuotes[benchmark.Symbol] = MapToBenchmarkQuote(benchmark.Symbol, quote);
                    }
                }
            }
            catch (Exception exception) when (exception is not InvalidOperationException)
            {
                _logger.LogWarning(exception, "Failed to fetch oil quotes from provider {Provider} at level {SourceIndex}", provider, sourceIndex);
            }
        }

        private static OilQuoteDto MapToBenchmarkQuote(string benchmarkSymbol, OilQuoteDto sourceQuote) => new()
        {
            Symbol = benchmarkSymbol,
            Price = sourceQuote.Price,
            Change = sourceQuote.Change,
            ChangePercent = sourceQuote.ChangePercent,
            Currency = sourceQuote.Currency,
            Source = sourceQuote.Source,
            LastTradeTime = sourceQuote.LastTradeTime
        };

        private async Task<IEnumerable<OilQuoteDto>> FetchFromProviderAsync(
            OilQuoteProvider provider,
            IEnumerable<string> tickers)
        {
            return provider switch
            {
                OilQuoteProvider.Yahoo => await _yahooOilConnector.GetOilQuotesAsync(tickers),
                OilQuoteProvider.Moex => await _moexOilConnector.GetOilQuotesAsync(tickers),
                _ => Enumerable.Empty<OilQuoteDto>()
            };
        }
    }
}
