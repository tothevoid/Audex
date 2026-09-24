#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Infrastructure.Entities.Securities;

namespace Audex.Application.Services.Brokers.Statements
{
    public class StatementSecurityResolver
    {
        private readonly Dictionary<string, Security> _securitiesByIsin = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, Security> _securitiesByTicker = new(StringComparer.OrdinalIgnoreCase);
        private readonly IStockConnector _stockConnector;

        public StatementSecurityResolver(
            IEnumerable<Security> databaseSecurities,
            IStockConnector stockConnector)
        {
            _stockConnector = stockConnector;

            foreach (var databaseSecurity in databaseSecurities)
            {
                if (!string.IsNullOrWhiteSpace(databaseSecurity.Isin))
                {
                    _securitiesByIsin.TryAdd(databaseSecurity.Isin.Trim(), databaseSecurity);
                }

                if (!string.IsNullOrWhiteSpace(databaseSecurity.Ticker))
                {
                    _securitiesByTicker.TryAdd(databaseSecurity.Ticker.Trim(), databaseSecurity);
                }
            }
        }

        public Security? FindByIsin(string? isin)
        {
            if (string.IsNullOrWhiteSpace(isin))
            {
                return null;
            }

            return _securitiesByIsin.GetValueOrDefault(isin.Trim());
        }

        public Security? FindByTicker(string? ticker)
        {
            if (string.IsNullOrWhiteSpace(ticker))
            {
                return null;
            }

            return _securitiesByTicker.GetValueOrDefault(ticker.Trim());
        }

        public Security? Find(string? isin, string? ticker)
        {
            return FindByIsin(isin) ?? FindByTicker(ticker);
        }

        public static string GetSecurityKey(string? isin, string? name, string? ticker)
        {
            if (!string.IsNullOrWhiteSpace(isin)) return $"isin:{isin.Trim().ToUpperInvariant()}";
            if (!string.IsNullOrWhiteSpace(ticker)) return $"ticker:{ticker.Trim().ToUpperInvariant()}";
            return $"name:{name?.Trim().ToUpperInvariant()}";
        }

        public async Task<Dictionary<string, StatementSecurityDto>> ResolveSecuritiesAsync(
            IReadOnlyList<ParsedStatementTransactionDto> transactions)
        {
            var result = new Dictionary<string, StatementSecurityDto>(StringComparer.OrdinalIgnoreCase);

            var uniqueSecurityItems = transactions
                .Select(transaction => (
                    Key: GetSecurityKey(transaction.Isin, transaction.SecurityName, transaction.Ticker),
                    transaction.Isin,
                    transaction.SecurityName,
                    transaction.Ticker))
                .DistinctBy(item => item.Key)
                .ToList();

            foreach (var item in uniqueSecurityItems)
            {
                result[item.Key] = await ResolveSingleSecurityAsync(
                    item.Isin,
                    item.Ticker,
                    item.SecurityName);
            }

            return result;
        }

        public async Task<StatementSecurityDto> ResolveSingleSecurityAsync(
            string? isin,
            string? ticker,
            string securityName)
        {
            var foundInDatabase = Find(isin, ticker);
            if (foundInDatabase != null)
            {
                return StatementSecurityDto.ExistingInDatabase(
                    foundInDatabase.Id,
                    foundInDatabase.Name,
                    foundInDatabase.Ticker,
                    foundInDatabase.Isin);
            }

            var marketQuery = !string.IsNullOrWhiteSpace(isin) ? isin : ticker;
            var marketInfo = !string.IsNullOrWhiteSpace(marketQuery)
                ? await _stockConnector.FindSecurityInfoAsync(marketQuery)
                : null;

            if (marketInfo == null)
            {
                return StatementSecurityDto.NotFoundInMarket(securityName, ticker, isin);
            }

            var foundByMarketTicker = FindByTicker(marketInfo.Ticker);

            if (foundByMarketTicker != null)
            {
                return StatementSecurityDto.ExistingInDatabase(
                    foundByMarketTicker.Id,
                    foundByMarketTicker.Name,
                    foundByMarketTicker.Ticker,
                    foundByMarketTicker.Isin ?? marketInfo.Isin ?? isin);
            }

            var resolvedName = !string.IsNullOrWhiteSpace(marketInfo.Name) ? marketInfo.Name : securityName;
            return StatementSecurityDto.CanBeCreatedFromMarket(
                resolvedName,
                marketInfo.Ticker,
                marketInfo.Isin ?? isin);
        }
    }
}
