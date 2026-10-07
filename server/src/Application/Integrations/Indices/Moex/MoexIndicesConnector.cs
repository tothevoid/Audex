#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Interfaces.Integrations.Indices;
using Audex.Application.Utilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Audex.Application.Integrations.Indices.Moex
{
    public class MoexIndicesConnector : IIndicesConnector, IMoexIndicesConnector
    {
        private const string SourceName = "MOEX";
        private const string MoexIndexBaseUrl = "https://iss.moex.com/iss/engines/stock/markets/index/securities.json?iss.meta=off&iss.only=securities,marketdata";

        public static readonly IReadOnlyList<string> SupportedIndexCodes = new[]
        {
            "IMOEX",
            "RTSI",
            "RGBI",
            "MCFTR"
        };


        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<MoexIndicesConnector> _logger;

        public MoexIndicesConnector(
            IHttpClientFactory httpClientFactory,
            ILogger<MoexIndicesConnector>? logger = null)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger ?? NullLogger<MoexIndicesConnector>.Instance;
        }

        public async Task<IEnumerable<MarketIndexQuoteDto>> GetIndicesQuotesAsync(IEnumerable<string>? indexCodes = null)
        {
            var requestedCodes = FilterRequestedCodes(indexCodes);
            if (requestedCodes.Count == 0)
            {
                return Enumerable.Empty<MarketIndexQuoteDto>();
            }

            var requestUrl = $"{MoexIndexBaseUrl}&securities={string.Join(",", requestedCodes)}";

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                var response = await httpClient.GetFromJsonAsync<MoexResponse>(requestUrl);

                if (response?.Securities?.Data == null || response.MarketData?.Data == null)
                {
                    _logger.LogWarning("MOEX ISS returned empty securities or market data for requested indices: {Indices}", string.Join(", ", requestedCodes));
                    return Enumerable.Empty<MarketIndexQuoteDto>();
                }

                return ParseIndicesQuotes(response, requestedCodes);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to fetch market indices quotes from MOEX ISS for: {Indices}", string.Join(", ", requestedCodes));
                return Enumerable.Empty<MarketIndexQuoteDto>();
            }
        }

        public Task<IReadOnlyList<string>> GetSupportedIndicesAsync()
        {
            return Task.FromResult(SupportedIndexCodes);
        }

        private static List<string> FilterRequestedCodes(IEnumerable<string>? indexCodes)
        {
            if (indexCodes == null || !indexCodes.Any())
            {
                return SupportedIndexCodes.ToList();
            }

            return indexCodes
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Select(code => code.Trim().ToUpperInvariant())
                .Distinct()
                .ToList();
        }

        private static IEnumerable<MarketIndexQuoteDto> ParseIndicesQuotes(
            MoexResponse response,
            List<string> requestedCodes)
        {
            var securitiesMetadata = ParseSecuritiesMetadata(response.Securities);
            var marketData = ParseMarketData(response.MarketData);

            var quotes = new List<MarketIndexQuoteDto>();

            foreach (var requestedCode in requestedCodes)
            {
                if (!marketData.TryGetValue(requestedCode, out var marketEntry))
                {
                    continue;
                }

                securitiesMetadata.TryGetValue(requestedCode, out var securityMeta);

                var resolvedName = !string.IsNullOrWhiteSpace(securityMeta?.Name)
                    ? securityMeta.Name
                    : requestedCode;

                var resolvedShortName = !string.IsNullOrWhiteSpace(securityMeta?.ShortName)
                    ? securityMeta.ShortName
                    : requestedCode;

                var resolvedCurrency = securityMeta?.Currency ?? string.Empty;

                var resolvedDecimals = securityMeta?.Decimals ?? 2;

                quotes.Add(new MarketIndexQuoteDto
                {
                    Code = requestedCode,
                    Name = resolvedName,
                    ShortName = resolvedShortName,
                    Value = marketEntry.Value,
                    ChangePoints = marketEntry.ChangePoints,
                    ChangePercent = marketEntry.ChangePercent,
                    Currency = resolvedCurrency,
                    Decimals = resolvedDecimals,
                    Source = SourceName,
                    LastUpdateTime = marketEntry.LastUpdateTime
                });
            }

            return quotes;
        }

        private static Dictionary<string, SecurityMetadataEntry> ParseSecuritiesMetadata(DynamicMoexResponseObject? securitiesObject)
        {
            var metadata = new Dictionary<string, SecurityMetadataEntry>(StringComparer.OrdinalIgnoreCase);
            if (securitiesObject?.Columns == null || securitiesObject.Data == null)
            {
                return metadata;
            }

            var columnIndexes = ParsingUtilities.GetColumnIndexMapping(securitiesObject.Columns);
            var secIdIndex = columnIndexes.GetValueOrDefault("SECID", -1);
            var nameIndex = columnIndexes.GetValueOrDefault("NAME", -1);
            var shortNameIndex = columnIndexes.GetValueOrDefault("SHORTNAME", -1);
            var currencyIdIndex = columnIndexes.GetValueOrDefault("CURRENCYID", -1);
            var decimalsIndex = columnIndexes.GetValueOrDefault("DECIMALS", -1);

            foreach (var row in securitiesObject.Data)
            {
                var securityId = row.GetString(secIdIndex);
                if (string.IsNullOrWhiteSpace(securityId))
                {
                    continue;
                }

                var name = row.GetString(nameIndex, string.Empty);
                var shortName = row.GetString(shortNameIndex, string.Empty);
                var currency = row.GetString(currencyIdIndex, string.Empty);
                var decimals = row.GetInt32(decimalsIndex, 2);

                metadata[securityId] = new SecurityMetadataEntry(name, shortName, currency, decimals);
            }

            return metadata;
        }

        private static Dictionary<string, MarketDataEntry> ParseMarketData(DynamicMoexResponseObject? marketDataObject)
        {
            var marketData = new Dictionary<string, MarketDataEntry>(StringComparer.OrdinalIgnoreCase);
            if (marketDataObject?.Columns == null || marketDataObject.Data == null)
            {
                return marketData;
            }

            var columnIndexes = ParsingUtilities.GetColumnIndexMapping(marketDataObject.Columns);
            var secIdIndex = columnIndexes.GetValueOrDefault("SECID", -1);
            var currentValueIndex = columnIndexes.GetValueOrDefault("CURRENTVALUE", -1);
            var lastValueIndex = columnIndexes.GetValueOrDefault("LASTVALUE", -1);
            var lastChangeIndex = columnIndexes.GetValueOrDefault("LASTCHANGE", -1);
            var lastChangePrcIndex = columnIndexes.GetValueOrDefault("LASTCHANGEPRC", -1);
            var sysTimeIndex = columnIndexes.GetValueOrDefault("SYSTIME", -1);

            foreach (var row in marketDataObject.Data)
            {
                var securityId = row.GetString(secIdIndex);
                if (string.IsNullOrWhiteSpace(securityId))
                {
                    continue;
                }

                var currentValue = row.TryGetDecimal(currentValueIndex);
                var lastValue = row.TryGetDecimal(lastValueIndex);
                var resolvedValue = currentValue ?? lastValue ?? 0m;

                var changePoints = row.GetDecimal(lastChangeIndex, 0m);
                var changePercent = row.GetDecimal(lastChangePrcIndex, 0m);
                var lastUpdateTime = row.TryGetDateTime(sysTimeIndex);

                marketData[securityId] = new MarketDataEntry(resolvedValue, changePoints, changePercent, lastUpdateTime);
            }

            return marketData;
        }

        private sealed record SecurityMetadataEntry(string Name, string ShortName, string Currency, int Decimals);

        private sealed record MarketDataEntry(decimal Value, decimal ChangePoints, decimal ChangePercent, DateTime? LastUpdateTime);
    }
}
