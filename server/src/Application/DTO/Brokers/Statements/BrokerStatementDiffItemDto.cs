#nullable enable
using System;
using System.Collections.Generic;
using Audex.Application.DTO.Securities;
using Audex.Application.Enums.Brokers;
using Audex.Application.Services.Brokers.Statements;
using Audex.Infrastructure.Entities.Securities;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class BrokerStatementDiffItemDto
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public StatementDiffType DiffType { get; set; }

        public StatementSecurityStatus SecurityResolutionStatus { get; set; }

        public bool HasWarning { get; set; }

        public string? WarningMessage { get; set; }

        public bool SelectedForApply { get; set; }

        public string SecurityName { get; set; } = string.Empty;

        public string Ticker { get; set; } = string.Empty;

        public string? Isin { get; set; }

        public bool IsConsolidated { get; set; }

        public int ConsolidatedCount { get; set; }

        public List<StatementDiscrepancyField> DiscrepancyFields { get; set; } = new List<StatementDiscrepancyField>();

        public SecurityTransactionDto? StatementTransaction { get; set; }

        public SecurityTransactionDto? DatabaseTransaction { get; set; }

        public DateTime TradeDateTime => StatementTransaction?.Date ?? DatabaseTransaction?.Date ?? DateTime.MinValue;

        public static BrokerStatementDiffItemDto FromIndividualMatch(
            SecurityTransaction databaseTransaction,
            ParsedStatementTransactionDto parsedTransaction,
            StatementSecurityStatus securityResolutionStatus,
            string securityName,
            string ticker)
        {
            ArgumentNullException.ThrowIfNull(databaseTransaction);
            ArgumentNullException.ThrowIfNull(parsedTransaction);

            var databaseTransactionDto = MapToDto(databaseTransaction);

            var statementTransactionDto = new SecurityTransactionDto
            {
                Id = Guid.NewGuid(),
                SecurityId = databaseTransaction.SecurityId,
                BrokerAccountId = databaseTransaction.BrokerAccountId,
                Date = parsedTransaction.TradeDateTime,
                IsSell = parsedTransaction.IsSell,
                Quantity = parsedTransaction.Quantity,
                Price = parsedTransaction.Price,
                BrokerCommission = parsedTransaction.BrokerCommission,
                StockExchangeCommission = parsedTransaction.StockExchangeCommission,
                Tax = parsedTransaction.Tax
            };

            var discrepancyFields = CalculateDiscrepancies(databaseTransactionDto, statementTransactionDto);
            bool hasDiscrepancies = discrepancyFields.Count > 0;

            return new BrokerStatementDiffItemDto
            {
                DiffType = hasDiscrepancies ? StatementDiffType.FieldDiscrepancy : StatementDiffType.Identical,
                SecurityResolutionStatus = securityResolutionStatus,
                HasWarning = false,
                WarningMessage = null,
                SelectedForApply = hasDiscrepancies,
                SecurityName = securityName,
                Ticker = ticker,
                Isin = parsedTransaction.Isin,
                IsConsolidated = parsedTransaction.IsConsolidated,
                ConsolidatedCount = parsedTransaction.ConsolidatedCount,
                DiscrepancyFields = discrepancyFields,
                StatementTransaction = statementTransactionDto,
                DatabaseTransaction = databaseTransactionDto
            };
        }

        public static BrokerStatementDiffItemDto FromClusterMatch(
            SecurityTransaction databaseTransaction,
            StatementTimeCluster cluster,
            string? parsedIsin,
            StatementSecurityStatus securityResolutionStatus,
            string securityName,
            string ticker)
        {
            ArgumentNullException.ThrowIfNull(databaseTransaction);
            ArgumentNullException.ThrowIfNull(cluster);

            var databaseTransactionDto = MapToDto(databaseTransaction);

            var statementTransactionDto = new SecurityTransactionDto
            {
                Id = Guid.NewGuid(),
                SecurityId = databaseTransaction.SecurityId,
                BrokerAccountId = databaseTransaction.BrokerAccountId,
                Date = cluster.LastTradeDateTime,
                IsSell = cluster.IsSell,
                Quantity = cluster.TotalQuantity,
                Price = cluster.WeightedPrice,
                BrokerCommission = cluster.TotalBrokerCommission,
                StockExchangeCommission = cluster.TotalStockExchangeCommission,
                Tax = cluster.TotalTax
            };

            var discrepancyFields = CalculateDiscrepancies(databaseTransactionDto, statementTransactionDto);
            bool hasDiscrepancies = discrepancyFields.Count > 0;

            return new BrokerStatementDiffItemDto
            {
                DiffType = hasDiscrepancies ? StatementDiffType.FieldDiscrepancy : StatementDiffType.Identical,
                SecurityResolutionStatus = securityResolutionStatus,
                HasWarning = false,
                WarningMessage = null,
                SelectedForApply = hasDiscrepancies,
                SecurityName = securityName,
                Ticker = ticker,
                Isin = cluster.Isin ?? parsedIsin,
                IsConsolidated = true,
                ConsolidatedCount = cluster.Count,
                DiscrepancyFields = discrepancyFields,
                StatementTransaction = statementTransactionDto,
                DatabaseTransaction = databaseTransactionDto
            };
        }

        public static BrokerStatementDiffItemDto CreateNew(
            ParsedStatementTransactionDto parsedTransaction,
            StatementSecurityStatus securityResolutionStatus,
            Guid? resolvedSecurityId,
            Guid brokerAccountId,
            string securityName,
            string ticker)
        {
            ArgumentNullException.ThrowIfNull(parsedTransaction);

            var statementTransactionDto = new SecurityTransactionDto
            {
                Id = Guid.NewGuid(),
                SecurityId = resolvedSecurityId ?? Guid.Empty,
                BrokerAccountId = brokerAccountId,
                Date = parsedTransaction.TradeDateTime,
                IsSell = parsedTransaction.IsSell,
                Quantity = parsedTransaction.Quantity,
                Price = parsedTransaction.Price,
                BrokerCommission = parsedTransaction.BrokerCommission,
                StockExchangeCommission = parsedTransaction.StockExchangeCommission,
                Tax = parsedTransaction.Tax
            };

            return new BrokerStatementDiffItemDto
            {
                DiffType = StatementDiffType.New,
                SecurityResolutionStatus = securityResolutionStatus,
                HasWarning = false,
                WarningMessage = null,
                SelectedForApply = true,
                SecurityName = securityName,
                Ticker = ticker,
                Isin = parsedTransaction.Isin,
                IsConsolidated = parsedTransaction.IsConsolidated,
                ConsolidatedCount = parsedTransaction.ConsolidatedCount,
                StatementTransaction = statementTransactionDto,
                DatabaseTransaction = null
            };
        }

        public static BrokerStatementDiffItemDto CreateNotFoundInMarket(
            ParsedStatementTransactionDto parsedTransaction,
            Guid brokerAccountId,
            string securityName,
            string ticker)
        {
            ArgumentNullException.ThrowIfNull(parsedTransaction);

            var statementTransactionDto = new SecurityTransactionDto
            {
                Id = Guid.NewGuid(),
                SecurityId = Guid.Empty,
                BrokerAccountId = brokerAccountId,
                Date = parsedTransaction.TradeDateTime,
                IsSell = parsedTransaction.IsSell,
                Quantity = parsedTransaction.Quantity,
                Price = parsedTransaction.Price,
                BrokerCommission = parsedTransaction.BrokerCommission,
                StockExchangeCommission = parsedTransaction.StockExchangeCommission,
                Tax = parsedTransaction.Tax
            };

            return new BrokerStatementDiffItemDto
            {
                DiffType = StatementDiffType.New,
                SecurityResolutionStatus = StatementSecurityStatus.NotFoundInMarket,
                HasWarning = true,
                WarningMessage = $"Ценная бумага не найдена в системе и на бирже (ISIN: {parsedTransaction.Isin ?? "отсутствует"})",
                SelectedForApply = false,
                SecurityName = securityName,
                Ticker = ticker,
                Isin = parsedTransaction.Isin,
                IsConsolidated = parsedTransaction.IsConsolidated,
                ConsolidatedCount = parsedTransaction.ConsolidatedCount,
                StatementTransaction = statementTransactionDto,
                DatabaseTransaction = null
            };
        }

        public static BrokerStatementDiffItemDto CreateMissingInStatement(SecurityTransaction databaseTransaction)
        {
            ArgumentNullException.ThrowIfNull(databaseTransaction);

            var databaseTransactionDto = MapToDto(databaseTransaction);

            return new BrokerStatementDiffItemDto
            {
                DiffType = StatementDiffType.MissingInStatement,
                SecurityResolutionStatus = StatementSecurityStatus.ExistingInDatabase,
                HasWarning = false,
                WarningMessage = null,
                SelectedForApply = false,
                SecurityName = databaseTransaction.Security?.Name ?? string.Empty,
                Ticker = databaseTransaction.Security?.Ticker ?? string.Empty,
                Isin = databaseTransaction.Security?.Isin,
                StatementTransaction = null,
                DatabaseTransaction = databaseTransactionDto
            };
        }

        private static SecurityTransactionDto MapToDto(SecurityTransaction databaseTransaction)
        {
            return new SecurityTransactionDto
            {
                Id = databaseTransaction.Id,
                SecurityId = databaseTransaction.SecurityId,
                BrokerAccountId = databaseTransaction.BrokerAccountId,
                Date = databaseTransaction.Date,
                IsSell = databaseTransaction.IsSell,
                Quantity = databaseTransaction.Quantity,
                Price = databaseTransaction.Price,
                BrokerCommission = databaseTransaction.BrokerCommission,
                StockExchangeCommission = databaseTransaction.StockExchangeCommission,
                Tax = databaseTransaction.Tax
            };
        }

        private static List<StatementDiscrepancyField> CalculateDiscrepancies(
            SecurityTransactionDto databaseTransaction,
            SecurityTransactionDto statementTransaction)
        {
            var discrepancies = new List<StatementDiscrepancyField>();

            if (Math.Abs(databaseTransaction.Price - statementTransaction.Price) > 0.0001m)
            {
                discrepancies.Add(StatementDiscrepancyField.Price);
            }

            if (Math.Abs(databaseTransaction.BrokerCommission - statementTransaction.BrokerCommission) > 0.01m)
            {
                discrepancies.Add(StatementDiscrepancyField.BrokerCommission);
            }

            if (Math.Abs(databaseTransaction.StockExchangeCommission - statementTransaction.StockExchangeCommission) > 0.01m)
            {
                discrepancies.Add(StatementDiscrepancyField.StockExchangeCommission);
            }

            if (Math.Abs(databaseTransaction.Tax - statementTransaction.Tax) > 0.01m)
            {
                discrepancies.Add(StatementDiscrepancyField.Tax);
            }

            if (Math.Abs((databaseTransaction.Date - statementTransaction.Date).TotalSeconds) > 60)
            {
                discrepancies.Add(StatementDiscrepancyField.Date);
            }

            return discrepancies;
        }
    }
}
