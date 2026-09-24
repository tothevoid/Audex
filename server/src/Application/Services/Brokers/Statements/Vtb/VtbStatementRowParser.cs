#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Interfaces.Common;
using Audex.Application.Services.Brokers.Statements.Vtb.Models;
using Audex.Application.Utilities.Currencies;
using Audex.Application.Utilities.Excel;

namespace Audex.Application.Services.Brokers.Statements.Vtb
{
    public class VtbStatementRowParser
    {
        private static readonly Regex IsinRegex = new(@"\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b", RegexOptions.Compiled);
        private static readonly CultureInfo RussianCulture = new("ru-RU");

        private static readonly IReadOnlyList<VtbColumnDefinition> ColumnDefinitions =
        [
            new VtbColumnDefinition(
                columnName: "Ценная бумага / Инструмент",
                isRequired: true,
                matchKeywords: ["Наименование ценной бумаги", "ISIN", "Финансовый инструмент"],
                applyValue: (cell, transaction, context) =>
                {
                    var rawText = cell.GetString().Trim();
                    if (!string.IsNullOrWhiteSpace(rawText))
                    {
                        if (context.IsCurrencyTable)
                        {
                            var (ticker, securityName) = ExtractCurrencyInfo(rawText);
                            transaction.Ticker = ticker;
                            transaction.SecurityName = securityName;
                        }
                        else
                        {
                            var (isin, ticker, securityName) = ExtractSecurityInfo(rawText);
                            transaction.Isin = isin;
                            transaction.Ticker = ticker;
                            transaction.SecurityName = securityName;
                        }
                    }
                }),

            new VtbColumnDefinition(
                columnName: "Дата и время сделки",
                isRequired: true,
                matchKeywords: ["Дата и время заключения", "Дата заключения", "Дата сделки"],
                applyValue: (cell, transaction, context) =>
                {
                    var (tradeDateTime, _) = ExcelCellParser.ParseDateTime(
                        cell,
                        context.TimeZone,
                        context.TimeZoneService,
                        RussianCulture);

                    transaction.TradeDateTime = tradeDateTime;
                }),

            new VtbColumnDefinition(
                columnName: "Вид сделки",
                isRequired: false,
                matchKeywords: ["Вид сделки", "Тип сделки"],
                applyValue: (cell, transaction, _) =>
                {
                    var dealTypeText = cell.GetString().Trim();
                    transaction.IsSell = dealTypeText.Contains("Продажа", StringComparison.OrdinalIgnoreCase);
                }),

            new VtbColumnDefinition(
                columnName: "Количество",
                isRequired: false,
                matchKeywords: ["Количество"],
                applyValue: (cell, transaction, _) =>
                {
                    transaction.Quantity = ExcelCellParser.ParseInt(cell);
                }),

            new VtbColumnDefinition(
                columnName: "Цена",
                isRequired: false,
                matchKeywords: ["Цена"],
                excludeKeywords: ["Валюта"],
                applyValue: (cell, transaction, _) =>
                {
                    transaction.Price = ExcelCellParser.ParseDecimal(cell);
                }),

            new VtbColumnDefinition(
                columnName: "Валюта расчетов",
                isRequired: false,
                matchKeywords: ["Валюта расчетов", "Валюта расчётов", "Валюта цены"],
                applyValue: (cell, transaction, _) =>
                {
                    var normalizedCurrency = CurrencyNormalizer.Normalize(cell.GetString());
                    if (!string.IsNullOrWhiteSpace(normalizedCurrency))
                    {
                        transaction.Currency = normalizedCurrency;
                    }
                }),

            new VtbColumnDefinition(
                columnName: "Комиссия брокера",
                isRequired: false,
                matchKeywords: ["заключение сделки", "за заключение"],
                applyValue: (cell, transaction, _) =>
                {
                    transaction.BrokerCommission = ExcelCellParser.ParseDecimal(cell);
                }),

            new VtbColumnDefinition(
                columnName: "Комиссия биржи",
                isRequired: false,
                matchKeywords: ["расчет по сделке", "расчёт по сделке", "за расчет", "за расчёт"],
                applyValue: (cell, transaction, _) =>
                {
                    transaction.StockExchangeCommission = ExcelCellParser.ParseDecimal(cell);
                }),

            new VtbColumnDefinition(
                columnName: "Номер заявки",
                isRequired: false,
                matchKeywords: ["№ заявки", "Номер заявки"],
                applyValue: (cell, transaction, _) =>
                {
                    var orderNumberText = cell.GetString().Trim();
                    transaction.OrderNumber = string.IsNullOrWhiteSpace(orderNumberText) ? null : orderNumberText;
                }),

            new VtbColumnDefinition(
                columnName: "Номер сделки",
                isRequired: false,
                matchKeywords: ["№ сделки", "Номер сделки"],
                excludeKeywords: ["у организатора"],
                applyValue: (cell, transaction, _) =>
                {
                    var tradeNumberText = cell.GetString().Trim();
                    transaction.TradeNumber = string.IsNullOrWhiteSpace(tradeNumberText) ? null : tradeNumberText;
                })
        ];

        public VtbTableSchema? TryBuildTableSchema(IXLWorksheet worksheet, int headerRowNumber)
        {
            var boundColumns = new List<VtbBoundColumn>();
            var boundColumnNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            ScanRowForColumns(worksheet.Row(headerRowNumber), boundColumns, boundColumnNames);

            bool mainRowHasRequiredColumn = boundColumns.Any(boundColumn => boundColumn.Definition.IsRequired);
            if (!mainRowHasRequiredColumn)
            {
                return null;
            }

            if (headerRowNumber < (worksheet.LastRowUsed()?.RowNumber() ?? headerRowNumber))
            {
                ScanRowForColumns(worksheet.Row(headerRowNumber + 1), boundColumns, boundColumnNames);
            }

            var schema = new VtbTableSchema(boundColumns);
            return schema.IsValid ? schema : null;
        }

        private static void ScanRowForColumns(
            IXLRow row,
            List<VtbBoundColumn> boundColumns,
            HashSet<string> boundColumnNames)
        {
            foreach (var cell in row.CellsUsed())
            {
                var headerText = cell.GetString().Trim();
                if (string.IsNullOrWhiteSpace(headerText))
                {
                    continue;
                }

                var matchedDefinition = FindMatchingColumnDefinition(headerText, boundColumnNames);
                if (matchedDefinition != null)
                {
                    boundColumns.Add(new VtbBoundColumn(cell.Address.ColumnNumber, matchedDefinition));
                    boundColumnNames.Add(matchedDefinition.ColumnName);
                }
            }
        }

        private static VtbColumnDefinition? FindMatchingColumnDefinition(
            string headerText,
            HashSet<string> boundColumnNames)
        {
            foreach (var definition in ColumnDefinitions)
            {
                if (!boundColumnNames.Contains(definition.ColumnName) && definition.Matches(headerText))
                {
                    return definition;
                }
            }

            return null;
        }

        public ParsedStatementTransactionDto? ParseRow(
            IXLRow row,
            VtbTableSchema schema,
            VtbParsingContext context)
        {
            var transaction = new ParsedStatementTransactionDto();

            foreach (var boundColumn in schema.BoundColumns)
            {
                var cell = row.Cell(boundColumn.ColumnNumber);
                boundColumn.Definition.ApplyValue(cell, transaction, context);
            }

            if (string.IsNullOrWhiteSpace(transaction.SecurityName) ||
                transaction.TradeDateTime == DateTime.MinValue)
            {
                return null;
            }

            return transaction;
        }

        private static (string? Isin, string? Ticker, string SecurityName) ExtractSecurityInfo(string rawText)
        {
            var isin = ExtractIsin(rawText);
            var commaIndex = rawText.IndexOf(',');
            var securityName = commaIndex > 0 ? rawText[..commaIndex].Trim() : rawText;

            string? ticker = null;
            if (isin == null && !rawText.Contains(' ') && !rawText.Contains(','))
            {
                ticker = rawText;
            }

            return (isin, ticker, securityName);
        }

        private static (string Ticker, string SecurityName) ExtractCurrencyInfo(string rawText)
        {
            var commaIndex = rawText.IndexOf(',');
            if (commaIndex <= 0)
            {
                return (rawText, rawText);
            }

            var ticker = rawText[..commaIndex].Trim();
            var securityName = rawText[(commaIndex + 1)..].Trim();

            return (ticker, string.IsNullOrWhiteSpace(securityName) ? ticker : securityName);
        }

        private static string? ExtractIsin(string text)
        {
            var isinMatch = IsinRegex.Match(text);
            return isinMatch.Success ? isinMatch.Value : null;
        }
    }
}
