#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using ClosedXML.Excel;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Services.Brokers.Statements.Vtb.Models
{
    public sealed class VtbColumnDefinition
    {
        public string ColumnName { get; }
        public bool IsRequired { get; }
        public IReadOnlyList<string> MatchKeywords { get; }
        public IReadOnlyList<string>? ExcludeKeywords { get; }
        public Action<IXLCell, ParsedStatementTransactionDto, VtbParsingContext> ApplyValue { get; }

        public VtbColumnDefinition(
            string columnName,
            bool isRequired,
            IReadOnlyList<string> matchKeywords,
            Action<IXLCell, ParsedStatementTransactionDto, VtbParsingContext> applyValue,
            IReadOnlyList<string>? excludeKeywords = null)
        {
            ColumnName = columnName;
            IsRequired = isRequired;
            MatchKeywords = matchKeywords;
            ApplyValue = applyValue;
            ExcludeKeywords = excludeKeywords;
        }

        public bool Matches(string headerText)
        {
            if (ExcludeKeywords != null && ExcludeKeywords.Any(excludeKeyword => headerText.Contains(excludeKeyword, StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }

            return MatchKeywords.Any(keyword => headerText.Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }
    }
}
