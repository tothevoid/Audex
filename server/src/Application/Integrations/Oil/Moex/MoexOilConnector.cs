#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Interfaces.Integrations.Oil;
using Audex.Application.Utilities;

using Microsoft.Extensions.Logging;

namespace Audex.Application.Integrations.Oil.Moex
{
    public class MoexOilConnector : IMoexOilConnector
    {
        private const string SourceName = "MOEX";
        private const string DefaultCurrency = "USD";
        private const string FortsOilQuotesUrl = "https://iss.moex.com/iss/engines/futures/markets/forts/boards/RFUD/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,BOARDID,SHORTNAME,SECNAME,PREVPRICE,LOTVOLUME,MINSTEP,LASTTRADEDATE,ASSETCODE,CURRENCYID,SETTLCURRENCY&marketdata.columns=SECID,BOARDID,LAST,CHANGE,LASTTOPREVPRICE,VALTODAY,TIME,SYSTIME,UPDATETIME,OPENPOSITION,CURRENCYID";

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<MoexOilConnector> _logger;

        public MoexOilConnector(
            IHttpClientFactory httpClientFactory,
            ILogger<MoexOilConnector> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<IEnumerable<OilQuoteDto>> GetOilQuotesAsync(IEnumerable<string> oilSymbols)
        {
            if (oilSymbols == null || !oilSymbols.Any())
            {
                return Enumerable.Empty<OilQuoteDto>();
            }

            var requestedSymbols = oilSymbols
                .Select(symbol => symbol.Trim().ToUpperInvariant())
                .Distinct()
                .ToList();

            if (requestedSymbols.Count == 0)
            {
                return Enumerable.Empty<OilQuoteDto>();
            }

            var httpClient = _httpClientFactory.CreateClient();
            var response = await FetchFortsDataAsync(httpClient, FortsOilQuotesUrl);

            if (response?.Securities?.Data == null || response.MarketData?.Data == null)
            {
                return Enumerable.Empty<OilQuoteDto>();
            }

            return ParseOilQuotes(response, requestedSymbols);
        }

        private async Task<MoexResponse?> FetchFortsDataAsync(HttpClient httpClient, string queryUrl)
        {
            try
            {
                var httpResponse = await httpClient.GetAsync(queryUrl);
                if (!httpResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("MOEX FORTS oil quotes request returned HTTP {StatusCode}", httpResponse.StatusCode);
                    return null;
                }

                return await httpResponse.Content.ReadFromJsonAsync<MoexResponse>();
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Failed to fetch MOEX FORTS oil quotes from {QueryUrl}", queryUrl);
                return null;
            }
        }

        private static IEnumerable<OilQuoteDto> ParseOilQuotes(MoexResponse moexResponse, List<string> requestedSymbols)
        {
            var marketData = ParseMarketData(moexResponse.MarketData);
            var contractsByAssetCode = GroupContractsByAssetCode(moexResponse.Securities, marketData);
            var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);

            var quotes = new List<OilQuoteDto>();
            foreach (var requestedSymbol in requestedSymbols)
            {
                if (!contractsByAssetCode.TryGetValue(requestedSymbol, out var contracts) || contracts.Count == 0)
                {
                    continue;
                }

                var selectedContract = SelectBestContract(contracts, todayDate);
                if (selectedContract != null)
                {
                    quotes.Add(MapToOilQuoteDto(requestedSymbol, selectedContract));
                }
            }

            return quotes;
        }

        private static Dictionary<string, MoexMarketDataEntry> ParseMarketData(DynamicMoexResponseObject marketDataObject)
        {
            var marketData = new Dictionary<string, MoexMarketDataEntry>(StringComparer.OrdinalIgnoreCase);
            if (marketDataObject?.Columns == null || marketDataObject.Data == null)
            {
                return marketData;
            }

            var columnIndexes = ParsingUtilities.GetColumnIndexMapping(marketDataObject.Columns);
            var securitySecIdIndex = columnIndexes.GetValueOrDefault("SECID", -1);
            var lastIndex = columnIndexes.GetValueOrDefault("LAST", -1);
            var changeIndex = columnIndexes.GetValueOrDefault("CHANGE", -1);
            var lastToPrevPriceIndex = columnIndexes.GetValueOrDefault("LASTTOPREVPRICE", -1);
            var valTodayIndex = columnIndexes.GetValueOrDefault("VALTODAY", -1);
            var sysTimeIndex = columnIndexes.GetValueOrDefault("SYSTIME", -1);

            foreach (var row in marketDataObject.Data)
            {
                var securityId = row.GetString(securitySecIdIndex);
                if (string.IsNullOrEmpty(securityId))
                {
                    continue;
                }

                var lastPrice = row.TryGetDecimal(lastIndex);
                var change = row.TryGetDecimal(changeIndex);
                var changePercent = row.TryGetDecimal(lastToPrevPriceIndex);
                var volumeToday = row.GetDecimal(valTodayIndex);
                var systemTime = row.GetString(sysTimeIndex);

                marketData[securityId] = new MoexMarketDataEntry(lastPrice, change, changePercent, volumeToday, systemTime);
            }

            return marketData;
        }

        private static Dictionary<string, List<MoexFuturesContract>> GroupContractsByAssetCode(
            DynamicMoexResponseObject securitiesObject,
            IReadOnlyDictionary<string, MoexMarketDataEntry> marketData)
        {
            var contractsByAssetCode = new Dictionary<string, List<MoexFuturesContract>>(StringComparer.OrdinalIgnoreCase);
            if (securitiesObject?.Columns == null || securitiesObject.Data == null)
            {
                return contractsByAssetCode;
            }

            var columnIndexes = ParsingUtilities.GetColumnIndexMapping(securitiesObject.Columns);
            var securitySecIdIndex = columnIndexes.GetValueOrDefault("SECID", -1);
            var prevPriceIndex = columnIndexes.GetValueOrDefault("PREVPRICE", -1);
            var lastTradeDateIndex = columnIndexes.GetValueOrDefault("LASTTRADEDATE", -1);
            var assetCodeIndex = columnIndexes.GetValueOrDefault("ASSETCODE", -1);
            var currencyIndex = columnIndexes.GetValueOrDefault("CURRENCYID", -1);
            if (currencyIndex < 0)
            {
                currencyIndex = columnIndexes.GetValueOrDefault("SETTLCURRENCY", -1);
            }

            foreach (var row in securitiesObject.Data)
            {
                var securityId = row.GetString(securitySecIdIndex);
                if (string.IsNullOrEmpty(securityId))
                {
                    continue;
                }

                var rawAssetCode = row.GetString(assetCodeIndex);
                var normalizedAssetCode = rawAssetCode.Trim().ToUpperInvariant();
                if (string.IsNullOrEmpty(normalizedAssetCode))
                {
                    continue;
                }

                var previousPrice = row.TryGetDecimal(prevPriceIndex);
                var lastTradeDate = row.TryGetDateOnly(lastTradeDateIndex);
                var rawCurrency = currencyIndex >= 0 ? row.GetString(currencyIndex) : null;
                var currency = string.IsNullOrWhiteSpace(rawCurrency) ? null : rawCurrency.Trim().ToUpperInvariant();

                var contractMarketData = marketData.GetValueOrDefault(securityId, MoexMarketDataEntry.Empty);

                if (!contractsByAssetCode.TryGetValue(normalizedAssetCode, out var contractList))
                {
                    contractList = [];
                    contractsByAssetCode[normalizedAssetCode] = contractList;
                }

                contractList.Add(new MoexFuturesContract(previousPrice, lastTradeDate, currency, contractMarketData));
            }

            return contractsByAssetCode;
        }

        private static MoexFuturesContract? SelectBestContract(
            IReadOnlyList<MoexFuturesContract> contracts,
            DateOnly todayDate)
        {
            var activeContracts = contracts
                .Where(contract => contract.LastTradeDate == null || contract.LastTradeDate >= todayDate)
                .ToList();

            return (activeContracts.Count > 0 ? activeContracts : contracts)
                .OrderByDescending(contract => contract.MarketData.VolumeToday)
                .ThenBy(contract => contract.LastTradeDate)
                .FirstOrDefault();
        }

        private static OilQuoteDto MapToOilQuoteDto(string requestedSymbol, MoexFuturesContract selectedContract)
        {
            var lastPrice = selectedContract.MarketData.LastPrice;
            var previousPrice = selectedContract.PreviousPrice;
            var currency = !string.IsNullOrWhiteSpace(selectedContract.Currency)
                ? selectedContract.Currency
                : DefaultCurrency;

            return new OilQuoteDto
            {
                Symbol = requestedSymbol,
                Price = FinancialUtilities.CalculatePrice(lastPrice, previousPrice),
                Change = FinancialUtilities.CalculateChange(lastPrice, previousPrice, selectedContract.MarketData.Change),
                ChangePercent = FinancialUtilities.CalculateChangePercent(lastPrice, previousPrice, selectedContract.MarketData.ChangePercent),
                Currency = currency,
                Source = SourceName,
                LastTradeTime = ParsingUtilities.TryGetDateTime(selectedContract.MarketData.SystemTime, DateTime.UtcNow)
            };
        }

        private sealed record MoexMarketDataEntry(
            decimal? LastPrice,
            decimal? Change,
            decimal? ChangePercent,
            decimal VolumeToday,
            string SystemTime)
        {
            public static readonly MoexMarketDataEntry Empty = new(null, null, null, 0m, string.Empty);
        }

        private sealed record MoexFuturesContract(
            decimal? PreviousPrice,
            DateOnly? LastTradeDate,
            string? Currency,
            MoexMarketDataEntry MarketData);
    }
}
