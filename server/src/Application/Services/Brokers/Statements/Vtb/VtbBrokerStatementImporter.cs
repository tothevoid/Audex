#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Interfaces.Brokers.Statements;
using Audex.Application.Interfaces.Common;
using Audex.Application.Services.Brokers.Statements.Vtb.Models;
using Audex.Application.Services.Common;

namespace Audex.Application.Services.Brokers.Statements.Vtb
{
    public class VtbBrokerStatementImporter : IBrokerStatementImporter
    {
        private readonly ITimeZoneService _timeZoneService;
        private readonly VtbStatementRowParser _rowParser;

        public VtbBrokerStatementImporter() : this(null, null)
        {
        }

        public VtbBrokerStatementImporter(
            ITimeZoneService? timeZoneService = null,
            VtbStatementRowParser? rowParser = null)
        {
            _timeZoneService = timeZoneService ?? new TimeZoneService();
            _rowParser = rowParser ?? new VtbStatementRowParser();
        }

        public string Id => "vtb";

        public string Name => "ВТБ Брокер";

        public IReadOnlyList<string> SupportedExtensions => new[] { ".xlsx" };

        public Task<IReadOnlyList<ParsedStatementTransactionDto>> ParseAsync(Stream fileStream, string timeZoneId)
        {
            var timeZone = _timeZoneService.ResolveTimeZone(timeZoneId);

            using var workbook = new XLWorkbook(fileStream);

            var transactions = new List<ParsedStatementTransactionDto>();

            foreach (var worksheet in workbook.Worksheets)
            {
                ParseWorksheetSequentially(worksheet, timeZone, transactions);
            }

            return Task.FromResult<IReadOnlyList<ParsedStatementTransactionDto>>(transactions);
        }

        private void ParseWorksheetSequentially(
            IXLWorksheet worksheet,
            TimeZoneInfo timeZone,
            List<ParsedStatementTransactionDto> transactions)
        {
            var firstRowNumber = worksheet.FirstRowUsed()?.RowNumber() ?? 1;
            var lastRowNumber = worksheet.LastRowUsed()?.RowNumber() ?? firstRowNumber;

            bool hasProcessedSecuritiesTable = false;
            bool hasProcessedCurrenciesTable = false;

            for (int currentRowNumber = firstRowNumber; currentRowNumber <= lastRowNumber; currentRowNumber++)
            {
                var row = worksheet.Row(currentRowNumber);

                var sectionTitle = FindSectionTitle(row);
                if (sectionTitle == null)
                {
                    continue;
                }

                if (!hasProcessedSecuritiesTable && IsSecuritiesSection(sectionTitle))
                {
                    currentRowNumber = ParseTable(
                        worksheet,
                        startRowNumber: currentRowNumber + 1,
                        lastRowNumber,
                        isCurrencyTable: false,
                        timeZone,
                        transactions);
                    hasProcessedSecuritiesTable = true;
                }
                else if (!hasProcessedCurrenciesTable && IsCurrenciesSection(sectionTitle))
                {
                    currentRowNumber = ParseTable(
                        worksheet,
                        startRowNumber: currentRowNumber + 1,
                        lastRowNumber,
                        isCurrencyTable: true,
                        timeZone,
                        transactions);
                    hasProcessedCurrenciesTable = true;
                }
            }
        }

        private int ParseTable(
            IXLWorksheet worksheet,
            int startRowNumber,
            int lastRowNumber,
            bool isCurrencyTable,
            TimeZoneInfo timeZone,
            List<ParsedStatementTransactionDto> transactions)
        {
            var (headerRowNumber, schema) = FindTableHeader(worksheet, startRowNumber, lastRowNumber);
            if (schema == null)
            {
                return headerRowNumber;
            }

            var context = new VtbParsingContext
            {
                TimeZone = timeZone,
                TimeZoneService = _timeZoneService,
                IsCurrencyTable = isCurrencyTable
            };

            return ParseTableTransactions(
                worksheet,
                startRowNumber: headerRowNumber + 1,
                lastRowNumber,
                schema,
                context,
                transactions);
        }

        private (int HeaderRowNumber, VtbTableSchema? Schema) FindTableHeader(
            IXLWorksheet worksheet,
            int startRowNumber,
            int lastRowNumber)
        {
            for (int currentRowNumber = startRowNumber; currentRowNumber <= lastRowNumber; currentRowNumber++)
            {
                var row = worksheet.Row(currentRowNumber);

                if (FindSectionTitle(row) != null)
                {
                    return (currentRowNumber - 1, null);
                }

                var schema = _rowParser.TryBuildTableSchema(worksheet, currentRowNumber);
                if (schema != null)
                {
                    return (currentRowNumber, schema);
                }
            }

            return (lastRowNumber, null);
        }

        private int ParseTableTransactions(
            IXLWorksheet worksheet,
            int startRowNumber,
            int lastRowNumber,
            VtbTableSchema schema,
            VtbParsingContext context,
            List<ParsedStatementTransactionDto> transactions)
        {
            int parsedTransactionsCount = 0;

            for (int currentRowNumber = startRowNumber; currentRowNumber <= lastRowNumber; currentRowNumber++)
            {
                var row = worksheet.Row(currentRowNumber);

                if (FindSectionTitle(row) != null)
                {
                    return currentRowNumber - 1;
                }

                var transaction = _rowParser.ParseRow(row, schema, context);
                if (transaction != null)
                {
                    transactions.Add(transaction);
                    parsedTransactionsCount++;
                }
                else if (parsedTransactionsCount > 0 || row.IsEmpty())
                {
                    return currentRowNumber;
                }
            }

            return lastRowNumber;
        }

        private static string? FindSectionTitle(IXLRow row)
        {
            foreach (var cell in row.CellsUsed())
            {
                var text = cell.GetString().Trim();
                if (IsSecuritiesSection(text) || IsCurrenciesSection(text))
                {
                    return text;
                }
            }
            return null;
        }

        private static bool IsSecuritiesSection(string text) =>
            text.Contains("сделки с ценными бумагами", StringComparison.OrdinalIgnoreCase);

        private static bool IsCurrenciesSection(string text) =>
            text.Contains("сделки с иностранной валютой", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("сделки с валютой", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("сделки с драгоценными металлами", StringComparison.OrdinalIgnoreCase);
    }
}
