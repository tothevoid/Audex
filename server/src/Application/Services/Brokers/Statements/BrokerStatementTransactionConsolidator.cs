#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Services.Brokers.Statements
{
    public static class BrokerStatementTransactionConsolidator
    {
        public const int DefaultTimeClusterSeconds = 120; // 2 minutes

        /// <summary>
        /// Always consolidates partial executions that share the exact same non-empty OrderNumber.
        /// The date is set to the latest trade date in the group.
        /// </summary>
        public static IReadOnlyList<ParsedStatementTransactionDto> ConsolidateByOrderNumber(
            IReadOnlyList<ParsedStatementTransactionDto>? transactions)
        {
            if (transactions == null || transactions.Count <= 1)
            {
                return transactions ?? Array.Empty<ParsedStatementTransactionDto>();
            }

            var result = new List<ParsedStatementTransactionDto>(transactions.Count);
            var ordersByNumber = new Dictionary<string, ParsedStatementTransactionDto>(StringComparer.OrdinalIgnoreCase);

            foreach (var transaction in transactions)
            {
                if (transaction.OrderNumber == null)
                {
                    result.Add(transaction.Clone());
                    continue;
                }

                if (ordersByNumber.TryGetValue(transaction.OrderNumber, out var existingConsolidatedTransaction))
                {
                    existingConsolidatedTransaction.MergeWith(transaction);
                }
                else
                {
                    var clonedTransaction = transaction.Clone();
                    ordersByNumber[transaction.OrderNumber] = clonedTransaction;
                    result.Add(clonedTransaction);
                }
            }

            return result;
        }

        /// <summary>
        /// Builds potential time clusters of transactions (window <= 120s) for fallback union matching.
        /// </summary>
        public static List<StatementTimeCluster> FindPotentialTimeClusters(
            IReadOnlyList<ParsedStatementTransactionDto> transactions,
            int maxDeltaSeconds = DefaultTimeClusterSeconds)
        {
            var clusters = new List<StatementTimeCluster>();
            if (transactions == null || transactions.Count <= 1)
            {
                return clusters;
            }

            var transactionGroups = GroupTransactionsByNaturalKey(transactions);

            foreach (var groupTransactions in transactionGroups.Values)
            {
                if (groupTransactions.Count <= 1)
                {
                    continue;
                }

                groupTransactions.Sort((firstTransaction, secondTransaction) =>
                    firstTransaction.TradeDateTime.CompareTo(secondTransaction.TradeDateTime));

                ExtractClustersFromSortedGroup(groupTransactions, maxDeltaSeconds, clusters);
            }

            clusters.Sort((firstCluster, secondCluster) =>
                firstCluster.LastTradeDateTime.CompareTo(secondCluster.LastTradeDateTime));

            return clusters;
        }

        private static Dictionary<string, List<ParsedStatementTransactionDto>> GroupTransactionsByNaturalKey(
            IReadOnlyList<ParsedStatementTransactionDto> transactions)
        {
            var groups = new Dictionary<string, List<ParsedStatementTransactionDto>>(StringComparer.OrdinalIgnoreCase);

            foreach (var transaction in transactions)
            {
                var groupKey = BuildClusterGroupKey(transaction);

                if (!groups.TryGetValue(groupKey, out var groupList))
                {
                    groupList = new List<ParsedStatementTransactionDto>();
                    groups[groupKey] = groupList;
                }

                groupList.Add(transaction);
            }

            return groups;
        }

        private static string BuildClusterGroupKey(ParsedStatementTransactionDto transaction)
        {
            var tradeDate = DateOnly.FromDateTime(transaction.TradeDateTime);
            var securityKey = transaction.Isin != null
                ? $"ISIN:{transaction.Isin}"
                : transaction.Ticker != null
                    ? $"TICKER:{transaction.Ticker}"
                    : $"NAME:{transaction.SecurityName}";

            var direction = transaction.IsSell ? "SELL" : "BUY";
            var currency = transaction.Currency;

            return $"{tradeDate:O}|{securityKey}|{direction}|{currency}";
        }

        private static void ExtractClustersFromSortedGroup(
            List<ParsedStatementTransactionDto> sortedTransactions,
            int maxDeltaSeconds,
            List<StatementTimeCluster> resultClusters)
        {
            StatementTimeCluster? activeCluster = null;

            foreach (var transaction in sortedTransactions)
            {
                if (activeCluster == null)
                {
                    activeCluster = new StatementTimeCluster(transaction);
                    continue;
                }

                var deltaSeconds = Math.Abs((transaction.TradeDateTime - activeCluster.LastTradeDateTime).TotalSeconds);
                if (deltaSeconds <= maxDeltaSeconds)
                {
                    activeCluster.Add(transaction);
                }
                else
                {
                    if (activeCluster.Count > 1)
                    {
                        resultClusters.Add(activeCluster);
                    }

                    activeCluster = new StatementTimeCluster(transaction);
                }
            }

            if (activeCluster != null && activeCluster.Count > 1)
            {
                resultClusters.Add(activeCluster);
            }
        }
    }
}
