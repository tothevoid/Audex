#nullable enable
using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using DocumentFormat.OpenXml.Drawing.Charts;
using Audex.Application.DTO.Securities;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Utilities;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Integrations.Stock.Moex
{
    public class MoexConnector(IHttpClientFactory httpClientFactory) : IStockConnector
    {
        public async Task<IEnumerable<SecurityHistoryValueDto>> GetTickerHistoryAsync(SecurityDto security, DateOnly from, DateOnly to, int interval = 24)
        {
            var candles = await GetCandlesAsync(security, from, to, interval);

            return candles
                .Where(c => c.Close > 0)
                .Select(c => new SecurityHistoryValueDto
                {
                    Date = c.Begin,
                    Value = c.Close
                });
        }

        public async Task<IEnumerable<MarketDataRow>> GetExtendedValuesByTickersAsync(IEnumerable<SecurityDto> securities)
        {
            var httpClient = httpClientFactory.CreateClient();

            var (baseSecurities, currencySecurities) = SplitTickersByType(securities);

            var result = new List<MarketDataRow>();

            if (baseSecurities.Count > 0)
            {
                var query = MoexUrlFactory.GetFullSecuritiesQuery(baseSecurities);
                result.AddRange(await FetchAndApplySecuritiesAsync(httpClient, query));
            }
           
            if (currencySecurities.Count > 0)
            {
                var query = MoexUrlFactory.GetFullCurrencySecuritiesQuery(currencySecurities);
                result.AddRange(await FetchAndApplySecuritiesAsync(httpClient, query));
            }

            return result;
        }

        public async Task<IEnumerable<MarketDataRow>> GetValuesByTickersAsync(IEnumerable<SecurityDto> securities)
        {
            var httpClient = httpClientFactory.CreateClient();

            var (baseSecurities, currencySecurities) = SplitTickersByType(securities);

            var dataRows = new List<MarketDataRow>();

            if (baseSecurities.Count > 0)
            {
                var baseSecuritiesQuery = MoexUrlFactory.GetBaseSecuritiesQuery(baseSecurities);
                dataRows.AddRange(await FetchMarketDataRowsAsync(httpClient, baseSecuritiesQuery));
            }

            if (currencySecurities.Count > 0)
            {
                var currencySecuritiesQuery = MoexUrlFactory.GetBaseCurrencySecuritiesQuery(currencySecurities);
                dataRows.AddRange(await FetchMarketDataRowsAsync(httpClient, currencySecuritiesQuery));
            }

            return dataRows;
        }

        private static async Task<IEnumerable<MarketDataRow>> FetchMarketDataRowsAsync(HttpClient httpClient, string query)
        {
            var tickersData = await FetchTickersDataAsync(httpClient, query);

            return ParseMarketDataRows(tickersData.MarketData.Columns, tickersData.MarketData);
        }

        private static async Task<MoexResponse> FetchTickersDataAsync(HttpClient httpClient, string query)
        {
            var result = await httpClient.GetAsync(query);
            return await result.Content.ReadFromJsonAsync<MoexResponse>() ?? new MoexResponse();
        }

        private static async Task<IEnumerable<MarketDataRow>> FetchAndApplySecuritiesAsync(HttpClient httpClient, string query)
        {
            var tickersData = await FetchTickersDataAsync(httpClient, query);

            var marketData = ParseMarketDataRows(tickersData.MarketData.Columns, tickersData.MarketData)
                .ToList();

            return ParseAndApplySecuritiesRows(marketData, tickersData.Securities.Columns, tickersData.Securities);
        }

        private static (HashSet<string> baseSecurities, HashSet<string> currencySecurities) SplitTickersByType(IEnumerable<dynamic> securities)
        {
            var baseSecurities = new HashSet<string>();
            var currencySecurities = new HashSet<string>();

            if (securities == null)
            {
                return (baseSecurities, currencySecurities);
            }

            foreach (var security in securities)
            {
                if (security.TypeId == SecurityTypeConstants.PreciousMetal)
                {
                    currencySecurities.Add(security.Ticker);
                }
                else
                {
                    baseSecurities.Add(security.Ticker);
                }
            }

            return (baseSecurities, currencySecurities);
        }

        private static IEnumerable<MarketDataRow> ParseMarketDataRows(IEnumerable<string> columns, DynamicMoexResponseObject marketData)
        {
            var columnsIndexes = GetColumnIndexMapping(columns);

            var boardIdIndex = columnsIndexes["BOARDID"];
            var openIndex = columnsIndexes["OPEN"];
            var tickerIndex = columnsIndexes["SECID"];
            var lastValueIndex = columnsIndexes["LAST"];
            var dateIndex = columnsIndexes["SYSTIME"];
            var marketPriceIndex = columnsIndexes["MARKETPRICE"];
            var lowIndex = columnsIndexes["LOW"];
            var highIndex = columnsIndexes["HIGH"];

            return marketData.Data
                .Select(row =>
                    new MarketDataRow()
                    {
                        Ticker = row.GetString(tickerIndex),
                        BoardId = row.GetString(boardIdIndex),
                        LastValue = row.TryGetDecimal(lastValueIndex),
                        Date = row.GetDateTime(dateIndex),
                        MarketPrice = row.TryGetDecimal(marketPriceIndex),
                        Open = row.TryGetDecimal(openIndex),
                        Low = row.GetDecimal(lowIndex, 0),
                        High = row.GetDecimal(highIndex, 0)
                    }
                )
                .OrderBy(row => GetBoardPriority(row.BoardId));
        }

        private static IEnumerable<MarketDataRow> ParseAndApplySecuritiesRows(IEnumerable<MarketDataRow> marketDataRows, 
            IEnumerable<string> columns,
            DynamicMoexResponseObject securities)
        {
            var columnsIndexes = GetColumnIndexMapping(columns);

            var tickerIndex = columnsIndexes["SECID"];
            var boardIdIndex = columnsIndexes["BOARDID"];
            var prevPrice = columnsIndexes["PREVPRICE"];

            var securityRows =  securities.Data
                .Select(row =>
                    new SecurityRow()
                    {
                        Ticker = row.GetString(tickerIndex),
                        BoardId = row.GetString(boardIdIndex),
                        PrevPrice = row.TryGetDecimal(prevPrice)
                    }
                )
                .OrderBy(row => GetBoardPriority(row.BoardId))
                .ToDictionary(key => key.GetUniqueKey(), value => value);

            foreach (var marketDataRow in marketDataRows)
            {
                var key = marketDataRow.GetUniqueKey();
                if (!securityRows.ContainsKey(key))
                {
                    continue;
                }

                marketDataRow.PrevPrice = securityRows[key].PrevPrice;
            }

            return marketDataRows;
        }

        private static int GetBoardPriority(string boardId) => boardId switch
        {
            "TQBR" => 1,
            "TQTF" => 2,
            "TQPI" => 3,
            "SMAL" => 4,
            "SPEQ" => 5,
            "EQRP" => 6,
            "EQOB" => 7,
            "TQOD" => 8,
            "CETS" => 9,
            _ => 100
        };

        private static Dictionary<string, int> GetColumnIndexMapping(IEnumerable<string> columns) => ParsingUtilities.GetColumnIndexMapping(columns);

        public async Task<IEnumerable<SecurityCandleDto>> GetCandlesAsync(SecurityDto security, DateOnly from, DateOnly to, int interval = 24)
        {
            var httpClient = httpClientFactory.CreateClient();
            var candles = new List<SecurityCandleDto>();
            int start = 0;
            const int batchSize = 500;
            const int delayMs = 150;

            while (true)
            {
                string query = MoexUrlFactory.GetCandlesQuery(security, from, to, interval, start);

                var batch = await FetchCandlesBatchAsync(query, httpClient);
                if (batch.Count == 0)
                {
                    break;
                }

                candles.AddRange(batch);

                if (batch.Count < batchSize)
                {
                    break;
                }

                start += batch.Count;
                await Task.Delay(delayMs);
            }

            return candles;
        }



        private static async Task<List<SecurityCandleDto>> FetchCandlesBatchAsync(string query, HttpClient httpClient)
        {
            var result = await httpClient.GetAsync(query);
            if (!result.IsSuccessStatusCode)
            {
                return [];
            }

            var response = await result.Content.ReadFromJsonAsync<MoexCandlesResponse>();
            var dataList = response?.Candles?.Data?.ToList();
            if (response?.Candles?.Columns == null || dataList == null || dataList.Count == 0)
            {
                return [];
            }

            var columnsIndexes = GetColumnIndexMapping(response.Candles.Columns);
            int openIndex = columnsIndexes.GetValueOrDefault("open", -1);
            int closeIndex = columnsIndexes.GetValueOrDefault("close", -1);
            int highIndex = columnsIndexes.GetValueOrDefault("high", -1);
            int lowIndex = columnsIndexes.GetValueOrDefault("low", -1);
            int valueIndex = columnsIndexes.GetValueOrDefault("value", -1);
            int volumeIndex = columnsIndexes.GetValueOrDefault("volume", -1);
            int beginIndex = columnsIndexes.GetValueOrDefault("begin", -1);
            int endIndex = columnsIndexes.GetValueOrDefault("end", -1);

            var candles = new List<SecurityCandleDto>();
            foreach (var row in dataList)
            {
                if (row == null) continue;

                var candle = new SecurityCandleDto
                {
                    Open = row.GetDecimal(openIndex),
                    Close = row.GetDecimal(closeIndex),
                    High = row.GetDecimal(highIndex),
                    Low = row.GetDecimal(lowIndex),
                    Value = row.GetDecimal(valueIndex),
                    Volume = row.GetDecimal(volumeIndex),
                    Begin = row.GetDateTime(beginIndex),
                    End = row.GetDateTime(endIndex)
                };

                candles.Add(candle);
            }

            return candles;
        }

        public async Task<MarketSecurityInfoDto?> FindSecurityInfoAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return null;
            }

            var trimmedQuery = query.Trim();
            var moexResponse = await FetchSecuritySearchResponseAsync(trimmedQuery);
            return ParseSecurityInfo(moexResponse, trimmedQuery);
        }

        private async Task<MoexResponse?> FetchSecuritySearchResponseAsync(string query)
        {
            var httpClient = httpClientFactory.CreateClient();
            var url = MoexUrlFactory.GetSearchSecurityQuery(query);
            var response = await httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadFromJsonAsync<MoexResponse>();
        }

        private static MarketSecurityInfoDto? ParseSecurityInfo(MoexResponse? moexResponse, string query)
        {
            if (moexResponse?.Securities?.Columns == null || moexResponse.Securities.Data == null)
            {
                return null;
            }

            var columnsIndexes = GetColumnIndexMapping(moexResponse.Securities.Columns);
            int secIdIndex = columnsIndexes.GetValueOrDefault("secid", -1);
            int shortNameIndex = columnsIndexes.GetValueOrDefault("shortname", -1);
            int nameIndex = columnsIndexes.GetValueOrDefault("name", -1);
            int isinIndex = columnsIndexes.GetValueOrDefault("isin", -1);
            int isTradedIndex = columnsIndexes.GetValueOrDefault("is_traded", -1);
            int groupIndex = columnsIndexes.GetValueOrDefault("group", -1);
            int typeIndex = columnsIndexes.GetValueOrDefault("type", -1);

            var rows = moexResponse.Securities.Data.ToList();
            if (rows.Count == 0)
            {
                return null;
            }

            bool IsTraded(object[] row) => row.GetInt32(isTradedIndex) == 1;
            bool IsSecIdMatch(object[] row) => string.Equals(row.GetString(secIdIndex), query, StringComparison.OrdinalIgnoreCase);
            bool IsIsinMatch(object[] row) => isinIndex >= 0 && string.Equals(row.GetString(isinIndex), query, StringComparison.OrdinalIgnoreCase);
            bool IsStandard(object[] row) =>
                IsStandardSecurity(row.GetString(groupIndex), row.GetString(typeIndex));

            int GetMatchScore(object[] row) =>
                CalculateMatchScore(IsTraded(row), IsSecIdMatch(row), IsIsinMatch(row), IsStandard(row));

            var bestRow = rows.MaxBy(GetMatchScore)!;

            string secId = bestRow.GetString(secIdIndex, query.ToUpper());
            string shortName = bestRow.GetString(shortNameIndex);
            string fullName = bestRow.GetString(nameIndex, shortName);
            string? isin = bestRow.TryGetString(isinIndex);
            string group = bestRow.GetString(groupIndex).ToLower();
            string type = bestRow.GetString(typeIndex).ToLower();

            Guid typeId = DetermineSecurityTypeId(group, type);

            string displayName = !string.IsNullOrWhiteSpace(shortName) && shortName != secId
                ? shortName
                : (!string.IsNullOrWhiteSpace(fullName) ? fullName : secId);

            return new MarketSecurityInfoDto
            {
                Ticker = secId,
                Name = displayName,
                FullName = fullName,
                Isin = isin,
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB
            };
        }

        private static readonly string[] StandardSecurityKeywords = ["stock", "bond", "share", "metal", "currency", "etf", "unit"];
        private static readonly string[] ExcludedSecurityKeywords = ["index", "option", "futures"];

        private static bool IsStandardSecurity(string group, string type)
        {
            var combined = $"{group} {type}".ToLower();
            return StandardSecurityKeywords.Any(combined.Contains)
                && !ExcludedSecurityKeywords.Any(combined.Contains);
        }

        private static Guid DetermineSecurityTypeId(string group, string type)
        {
            var combined = $"{group} {type}";

            if (combined.Contains("bond"))
            {
                return SecurityTypeConstants.Bond;
            }

            if (combined.Contains("etf") || combined.Contains("ppif") || combined.Contains("unit"))
            {
                return SecurityTypeConstants.InvestmentFundUnit;
            }

            if (combined.Contains("metal"))
            {
                return SecurityTypeConstants.PreciousMetal;
            }

            if (combined.Contains("currency"))
            {
                return SecurityTypeConstants.Currency;
            }

            return SecurityTypeConstants.Stock;
        }

        private static int CalculateMatchScore(bool isTraded, bool isSecIdMatch, bool isIsinMatch, bool isStandardSecurity)
        {
            int baseScore;
            if (isSecIdMatch && isIsinMatch)
            {
                baseScore = 50;
            }
            else if (isSecIdMatch && isStandardSecurity)
            {
                baseScore = 45;
            }
            else if (isIsinMatch && isStandardSecurity)
            {
                baseScore = 40;
            }
            else if (isSecIdMatch)
            {
                baseScore = 35;
            }
            else if (isIsinMatch)
            {
                baseScore = 30;
            }
            else if (isStandardSecurity)
            {
                baseScore = 15;
            }
            else
            {
                baseScore = 5;
            }

            return baseScore * (isTraded ? 2 : 1);
        }
    }
}
