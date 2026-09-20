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
            return await result.Content.ReadFromJsonAsync<MoexResponse>();
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
                        Ticker = Convert.ToString(row[tickerIndex]),
                        BoardId = Convert.ToString(row[boardIdIndex]),
                        LastValue = TryGetDecimalValue(row[lastValueIndex]),
                        Date = Convert.ToDateTime(row[dateIndex].ToString()),
                        MarketPrice = TryGetDecimalValue(row[marketPriceIndex]),
                        Open = TryGetDecimalValue(row[openIndex]),
                        Low = TryGetDecimalValue(row[lowIndex], 0),
                        High = TryGetDecimalValue(row[highIndex], 0)
                    }
                )
                .OrderBy(row => GetBoardPriority(row.BoardId));
        }

        private static decimal? TryGetDecimalValue(object value)
        {
            return value != null
                ? Convert.ToDecimal(value.ToString(), CultureInfo.InvariantCulture)
                : null;
        }

        private static decimal TryGetDecimalValue(object value, decimal defaultValue)
        {
            return TryGetDecimalValue(value) ?? defaultValue;
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
                        Ticker = Convert.ToString(row[tickerIndex]),
                        BoardId = Convert.ToString(row[boardIdIndex]),
                        PrevPrice = TryGetDecimalValue(row[prevPrice])
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

        private static Dictionary<string, int> GetColumnIndexMapping(IEnumerable<string> columns)
        {
            var columnsIndexes = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            int i = 0;
            foreach (var col in columns)
            {
                columnsIndexes[col] = i++;
            }

            return columnsIndexes;
        }

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

        private static decimal GetDecimalValue(object[] row, int index, decimal defaultValue = 0m)
        {
            return index >= 0 && index < row.Length && row[index] != null
                ? TryGetDecimalValue(row[index], defaultValue)
                : defaultValue;
        }

        private static DateTime GetDateTimeValue(object[] row, int index, DateTime defaultValue = default)
        {
            return index >= 0 && index < row.Length && row[index] != null
                ? Convert.ToDateTime(row[index].ToString(), CultureInfo.InvariantCulture)
                : defaultValue;
        }

        private static string GetStringValue(object[] row, int index, string defaultValue = "")
        {
            return index >= 0 && index < row.Length && row[index] != null
                ? Convert.ToString(row[index]) ?? defaultValue
                : defaultValue;
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
            int openIdx = columnsIndexes.GetValueOrDefault("open", -1);
            int closeIdx = columnsIndexes.GetValueOrDefault("close", -1);
            int highIdx = columnsIndexes.GetValueOrDefault("high", -1);
            int lowIdx = columnsIndexes.GetValueOrDefault("low", -1);
            int valueIdx = columnsIndexes.GetValueOrDefault("value", -1);
            int volumeIdx = columnsIndexes.GetValueOrDefault("volume", -1);
            int beginIdx = columnsIndexes.GetValueOrDefault("begin", -1);
            int endIdx = columnsIndexes.GetValueOrDefault("end", -1);

            var candles = new List<SecurityCandleDto>();
            foreach (var row in dataList)
            {
                if (row == null) continue;

                var candle = new SecurityCandleDto
                {
                    Open = GetDecimalValue(row, openIdx),
                    Close = GetDecimalValue(row, closeIdx),
                    High = GetDecimalValue(row, highIdx),
                    Low = GetDecimalValue(row, lowIdx),
                    Value = GetDecimalValue(row, valueIdx),
                    Volume = GetDecimalValue(row, volumeIdx),
                    Begin = GetDateTimeValue(row, beginIdx),
                    End = GetDateTimeValue(row, endIdx)
                };

                candles.Add(candle);
            }

            return candles;
        }

        public async Task<MoexSecurityInfoDto?> FindSecurityInfoAsync(string query)
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

        private static MoexSecurityInfoDto? ParseSecurityInfo(MoexResponse? moexResponse, string query)
        {
            if (moexResponse?.Securities?.Columns == null || moexResponse.Securities.Data == null)
            {
                return null;
            }

            var columnsIndexes = GetColumnIndexMapping(moexResponse.Securities.Columns);
            int secIdIdx = columnsIndexes.GetValueOrDefault("secid", -1);
            int shortNameIdx = columnsIndexes.GetValueOrDefault("shortname", -1);
            int nameIdx = columnsIndexes.GetValueOrDefault("name", -1);
            int isinIdx = columnsIndexes.GetValueOrDefault("isin", -1);
            int isTradedIdx = columnsIndexes.GetValueOrDefault("is_traded", -1);
            int groupIdx = columnsIndexes.GetValueOrDefault("group", -1);
            int typeIdx = columnsIndexes.GetValueOrDefault("type", -1);

            var rows = moexResponse.Securities.Data.ToList();
            if (rows.Count == 0)
            {
                return null;
            }

            bool IsTraded(object[] r) => isTradedIdx >= 0 && Convert.ToInt32(r[isTradedIdx]?.ToString() ?? "0") == 1;
            bool IsSecIdMatch(object[] r) => string.Equals(GetStringValue(r, secIdIdx), query, StringComparison.OrdinalIgnoreCase);
            bool IsIsinMatch(object[] r) => isinIdx >= 0 && string.Equals(GetStringValue(r, isinIdx), query, StringComparison.OrdinalIgnoreCase);
            bool IsStandard(object[] r) =>
                IsStandardSecurity(GetStringValue(r, groupIdx), GetStringValue(r, typeIdx));

            int GetMatchScore(object[] r)
            {
                bool isTraded = IsTraded(r);
                if (IsSecIdMatch(r)) return isTraded ? 60 : 50;
                if (IsIsinMatch(r)) return isTraded ? 40 : 30;
                if (isTraded && IsStandard(r)) return 20;
                if (isTraded) return 10;
                return 0;
            }

            var bestRow = rows.MaxBy(GetMatchScore)!;

            string secId = GetStringValue(bestRow, secIdIdx, query.ToUpper());
            string shortName = GetStringValue(bestRow, shortNameIdx);
            string fullName = GetStringValue(bestRow, nameIdx, shortName);
            string? isin = isinIdx >= 0 && bestRow[isinIdx] != null ? Convert.ToString(bestRow[isinIdx]) : null;
            string group = GetStringValue(bestRow, groupIdx).ToLower();
            string type = GetStringValue(bestRow, typeIdx).ToLower();

            Guid typeId = DetermineSecurityTypeId(group, type);

            string displayName = !string.IsNullOrWhiteSpace(shortName) && shortName != secId
                ? shortName
                : (!string.IsNullOrWhiteSpace(fullName) ? fullName : secId);

            return new MoexSecurityInfoDto
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
    }
}
