#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Enums.Brokers;
using Audex.Application.Interfaces.Brokers.Statements;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Brokers.Statements
{
    public class BrokerStatementDiffEngine : IBrokerStatementDiffEngine
    {
        private readonly IRepository<SecurityTransaction> _securityTransactionRepo;
        private readonly IRepository<Security> _securityRepo;
        private readonly IRepository<BrokerAccount> _brokerAccountRepo;
        private readonly IStockConnector _stockConnector;

        public BrokerStatementDiffEngine(
            IUnitOfWork uow,
            IStockConnector stockConnector)
        {
            _securityTransactionRepo = uow.CreateRepository<SecurityTransaction>();
            _securityRepo = uow.CreateRepository<Security>();
            _brokerAccountRepo = uow.CreateRepository<BrokerAccount>();
            _stockConnector = stockConnector;
        }

        public async Task<BrokerStatementAnalysisResultDto> ComputeDiffAsync(
            Guid brokerAccountId,
            string importerId,
            string timeZoneId,
            IReadOnlyList<ParsedStatementTransactionDto> parsedTransactions)
        {
            var brokerAccount = await _brokerAccountRepo.GetByIdAsync(brokerAccountId);
            if (brokerAccount == null)
            {
                throw new KeyNotFoundException($"Broker account with ID '{brokerAccountId}' was not found.");
            }

            var result = new BrokerStatementAnalysisResultDto
            {
                BrokerAccountId = brokerAccountId,
                BrokerAccountName = brokerAccount.Name,
                ImporterId = importerId,
                TimeZoneId = timeZoneId
            };

            if (parsedTransactions == null || parsedTransactions.Count == 0)
            {
                return result;
            }

            // 1. Always consolidate partial executions of the same OrderNumber (set date to latest fill)
            parsedTransactions = BrokerStatementTransactionConsolidator.ConsolidateByOrderNumber(parsedTransactions);

            // 2. Build potential time clusters (window 120s) for fallback union matching
            var timeClusters = BrokerStatementTransactionConsolidator.FindPotentialTimeClusters(parsedTransactions, 120);

            result.PeriodStart = parsedTransactions.Min(transaction => transaction.TradeDateTime);
            result.PeriodEnd = parsedTransactions.Max(transaction => transaction.TradeDateTime);

            var databaseSecurities = (await _securityRepo.GetAllAsync()).ToList();
            var securityResolver = new StatementSecurityResolver(databaseSecurities, _stockConnector);
            var resolvedSecurities = await securityResolver.ResolveSecuritiesAsync(parsedTransactions);
            result.Securities = resolvedSecurities.Values.ToList();

            var databaseTransactions = await LoadDatabaseTransactionsInRangeAsync(
                brokerAccountId,
                result.PeriodStart.Value,
                result.PeriodEnd.Value);

            var matchedDatabaseIds = new HashSet<Guid>();
            var diffItems = new List<BrokerStatementDiffItemDto>();

            MatchParsedTransactions(
                brokerAccountId,
                parsedTransactions,
                databaseTransactions,
                resolvedSecurities,
                timeClusters,
                diffItems,
                matchedDatabaseIds);

            AppendMissingDatabaseTransactions(diffItems, databaseTransactions, matchedDatabaseIds);
            result.SetDiffItems(diffItems);

            return result;
        }

        private async Task<List<SecurityTransaction>> LoadDatabaseTransactionsInRangeAsync(
            Guid brokerAccountId,
            DateTime periodStart,
            DateTime periodEnd)
        {
            var rawMin = periodStart.Date.AddDays(-3);
            var rawMax = periodEnd.Date.AddDays(3);
            var minDate = DateTime.SpecifyKind(rawMin, DateTimeKind.Utc);
            var maxDate = DateTime.SpecifyKind(rawMax, DateTimeKind.Utc);

            return (await _securityTransactionRepo.GetAllAsync(
                filter: transaction => transaction.BrokerAccountId == brokerAccountId &&
                                       transaction.Date >= minDate &&
                                       transaction.Date <= maxDate,
                include: query => query.Include(transaction => transaction.Security),
                disableTracking: true))
                .ToList();
        }

        private static void MatchParsedTransactions(
            Guid brokerAccountId,
            IReadOnlyList<ParsedStatementTransactionDto> parsedTransactions,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            IReadOnlyDictionary<string, StatementSecurityDto> resolvedSecurities,
            IReadOnlyList<StatementTimeCluster> timeClusters,
            List<BrokerStatementDiffItemDto> diffItems,
            HashSet<Guid> matchedDatabaseIds)
        {
            var processedStatementTransactions = new HashSet<ParsedStatementTransactionDto>();

            foreach (var parsedTransaction in parsedTransactions)
            {
                if (processedStatementTransactions.Contains(parsedTransaction))
                {
                    continue;
                }

                var diffItem = MatchSingleTransaction(
                    brokerAccountId,
                    parsedTransaction,
                    databaseTransactions,
                    resolvedSecurities,
                    timeClusters,
                    matchedDatabaseIds,
                    processedStatementTransactions);

                diffItems.Add(diffItem);
                processedStatementTransactions.Add(parsedTransaction);
            }
        }

        private static BrokerStatementDiffItemDto MatchSingleTransaction(
            Guid brokerAccountId,
            ParsedStatementTransactionDto parsedTransaction,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            IReadOnlyDictionary<string, StatementSecurityDto> resolvedSecurities,
            IReadOnlyList<StatementTimeCluster> timeClusters,
            HashSet<Guid> matchedDatabaseIds,
            HashSet<ParsedStatementTransactionDto> processedStatementTransactions)
        {
            var (status, resolvedSecurityId, ticker, securityName) = GetSecurityContext(parsedTransaction, resolvedSecurities);

            if (status == StatementSecurityStatus.NotFoundInMarket)
            {
                return BrokerStatementDiffItemDto.CreateNotFoundInMarket(parsedTransaction, brokerAccountId, securityName, ticker);
            }

            var individualMatch = TryMatchIndividual(
                resolvedSecurityId,
                parsedTransaction,
                status,
                securityName,
                ticker,
                databaseTransactions,
                matchedDatabaseIds);

            if (individualMatch != null)
            {
                return individualMatch;
            }

            var unionMatch = TryMatchUnion(
                resolvedSecurityId,
                parsedTransaction,
                status,
                securityName,
                ticker,
                timeClusters,
                databaseTransactions,
                matchedDatabaseIds,
                processedStatementTransactions);

            if (unionMatch != null)
            {
                return unionMatch;
            }

            return BrokerStatementDiffItemDto.CreateNew(
                parsedTransaction,
                status,
                resolvedSecurityId,
                brokerAccountId,
                securityName,
                ticker);
        }

        private static (StatementSecurityStatus Status, Guid? SecurityId, string Ticker, string SecurityName) GetSecurityContext(
            ParsedStatementTransactionDto parsedTransaction,
            IReadOnlyDictionary<string, StatementSecurityDto> resolvedSecurities)
        {
            var securityKey = StatementSecurityResolver.GetSecurityKey(parsedTransaction.Isin, parsedTransaction.SecurityName, parsedTransaction.Ticker);
            resolvedSecurities.TryGetValue(securityKey, out var resolvedSecurity);

            var status = resolvedSecurity?.Status ?? StatementSecurityStatus.NotFoundInMarket;
            var resolvedSecurityId = resolvedSecurity?.ResolvedSecurityId;
            var ticker = resolvedSecurity?.Ticker ?? parsedTransaction.Ticker ?? parsedTransaction.Isin ?? string.Empty;
            var securityName = resolvedSecurity?.Name ?? parsedTransaction.SecurityName;

            return (status, resolvedSecurityId, ticker, securityName);
        }

        private static BrokerStatementDiffItemDto? TryMatchIndividual(
            Guid? resolvedSecurityId,
            ParsedStatementTransactionDto parsedTransaction,
            StatementSecurityStatus status,
            string securityName,
            string ticker,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            HashSet<Guid> matchedDatabaseIds)
        {
            var candidate = FindIndividualCandidate(resolvedSecurityId, parsedTransaction, databaseTransactions, matchedDatabaseIds);
            if (candidate == null)
            {
                return null;
            }

            matchedDatabaseIds.Add(candidate.Id);

            return BrokerStatementDiffItemDto.FromIndividualMatch(
                candidate,
                parsedTransaction,
                status,
                securityName,
                ticker);
        }

        private static BrokerStatementDiffItemDto? TryMatchUnion(
            Guid? resolvedSecurityId,
            ParsedStatementTransactionDto parsedTransaction,
            StatementSecurityStatus status,
            string securityName,
            string ticker,
            IReadOnlyList<StatementTimeCluster> timeClusters,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            HashSet<Guid> matchedDatabaseIds,
            HashSet<ParsedStatementTransactionDto> processedStatementTransactions)
        {
            var (unionCandidate, matchedCluster) = FindUnionCandidate(
                resolvedSecurityId,
                parsedTransaction,
                timeClusters,
                databaseTransactions,
                matchedDatabaseIds,
                processedStatementTransactions);

            if (unionCandidate == null || matchedCluster == null)
            {
                return null;
            }

            matchedDatabaseIds.Add(unionCandidate.Id);
            processedStatementTransactions.UnionWith(matchedCluster.Transactions);

            return BrokerStatementDiffItemDto.FromClusterMatch(
                unionCandidate,
                matchedCluster,
                parsedTransaction.Isin,
                status,
                securityName,
                ticker);
        }

        private static SecurityTransaction? FindIndividualCandidate(
            Guid? resolvedSecurityId,
            ParsedStatementTransactionDto parsedTransaction,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            HashSet<Guid> matchedDatabaseIds)
        {
            if (!resolvedSecurityId.HasValue)
            {
                return null;
            }

            var matchingCandidates = FindMatchingDatabaseTransactions(
                databaseTransactions,
                matchedDatabaseIds,
                resolvedSecurityId.Value,
                parsedTransaction.IsSell,
                parsedTransaction.Quantity,
                parsedTransaction.TradeDateTime);

            if (matchingCandidates.Count == 0)
            {
                return null;
            }

            // Stage 1: Exact price match
            var exactPriceMatch = matchingCandidates
                .Where(transaction => Math.Abs(transaction.Price - parsedTransaction.Price) < 0.0001m)
                .OrderBy(transaction => Math.Abs((transaction.Date - parsedTransaction.TradeDateTime).Ticks))
                .FirstOrDefault();

            if (exactPriceMatch != null)
            {
                return exactPriceMatch;
            }

            // Stage 2: Acceptable broker price/amount rounding tolerance
            var totalStatementAmount = parsedTransaction.Quantity * parsedTransaction.Price;

            return matchingCandidates
                .Where(transaction => Math.Abs(transaction.Price - parsedTransaction.Price) <= 0.05m ||
                                      Math.Abs((transaction.Quantity * transaction.Price) - totalStatementAmount) <= 0.15m)
                .OrderBy(transaction => Math.Abs(transaction.Price - parsedTransaction.Price))
                .ThenBy(transaction => Math.Abs((transaction.Date - parsedTransaction.TradeDateTime).Ticks))
                .FirstOrDefault();
        }

        private static (SecurityTransaction? UnionCandidate, StatementTimeCluster? MatchedCluster) FindUnionCandidate(
            Guid? resolvedSecurityId,
            ParsedStatementTransactionDto parsedTransaction,
            IReadOnlyList<StatementTimeCluster> timeClusters,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            HashSet<Guid> matchedDatabaseIds,
            HashSet<ParsedStatementTransactionDto> processedStatementTransactions)
        {
            if (!resolvedSecurityId.HasValue)
            {
                return (null, null);
            }

            var cluster = timeClusters.FirstOrDefault(candidateCluster =>
                candidateCluster.Contains(parsedTransaction) &&
                candidateCluster.Transactions.All(transaction => !processedStatementTransactions.Contains(transaction)));

            if (cluster == null)
            {
                return (null, null);
            }

            var matchingCandidates = FindMatchingDatabaseTransactions(
                databaseTransactions,
                matchedDatabaseIds,
                resolvedSecurityId.Value,
                cluster.IsSell,
                cluster.TotalQuantity,
                cluster.LastTradeDateTime);

            var unionCandidate = matchingCandidates
                .Where(transaction => Math.Abs(transaction.Price - cluster.WeightedPrice) <= 0.05m)
                .OrderBy(transaction => Math.Abs((transaction.Date - cluster.LastTradeDateTime).Ticks))
                .FirstOrDefault();

            return (unionCandidate, unionCandidate != null ? cluster : null);
        }

        private static List<SecurityTransaction> FindMatchingDatabaseTransactions(
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            HashSet<Guid> matchedDatabaseIds,
            Guid securityId,
            bool isSell,
            int quantity,
            DateTime tradeDateTime)
        {
            return databaseTransactions
                .Where(transaction => transaction.SecurityId == securityId &&
                                      transaction.IsSell == isSell &&
                                      transaction.Quantity == quantity &&
                                      IsDateMatch(transaction.Date, tradeDateTime) &&
                                      !matchedDatabaseIds.Contains(transaction.Id))
                .ToList();
        }

        private static void AppendMissingDatabaseTransactions(
            List<BrokerStatementDiffItemDto> diffItems,
            IReadOnlyList<SecurityTransaction> databaseTransactions,
            HashSet<Guid> matchedDatabaseIds)
        {
            foreach (var databaseTransaction in databaseTransactions)
            {
                if (!matchedDatabaseIds.Contains(databaseTransaction.Id))
                {
                    diffItems.Add(BrokerStatementDiffItemDto.CreateMissingInStatement(databaseTransaction));
                }
            }
        }


        private static bool IsDateMatch(DateTime dbDate, DateTime statementDate)
        {
            // Exact same calendar day in raw DateTime (covers same day regardless of time of day)
            if (DateOnly.FromDateTime(dbDate) == DateOnly.FromDateTime(statementDate))
            {
                return true;
            }

            // Same calendar day after converting to local time (covers UTC vs local day shifts)
            if (DateOnly.FromDateTime(dbDate.ToLocalTime()) == DateOnly.FromDateTime(statementDate.ToLocalTime()))
            {
                return true;
            }

            // Within 36 hours (covers any intraday transaction with timezone offset across midnight)
            if (Math.Abs((dbDate - statementDate).TotalHours) <= 36)
            {
                return true;
            }

            return false;
        }
    }
}
