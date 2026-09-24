using System;
using System.Collections.Generic;
using System.Linq;
using Audex.Application.Enums.Brokers;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class BrokerStatementAnalysisResultDto
    {
        public Guid SessionId { get; set; } = Guid.NewGuid();

        public Guid BrokerAccountId { get; set; }

        public string BrokerAccountName { get; set; } = string.Empty;

        public string ImporterId { get; set; } = string.Empty;

        public string TimeZoneId { get; set; } = string.Empty;

        public DateTime? PeriodStart { get; set; }

        public DateTime? PeriodEnd { get; set; }

        public IReadOnlyList<BrokerStatementDiffItemDto> DiffItems { get; set; } = new List<BrokerStatementDiffItemDto>();

        public IReadOnlyList<StatementSecurityDto> Securities { get; set; } = new List<StatementSecurityDto>();

        public int NewCount { get; set; }

        public int DiscrepancyCount { get; set; }

        public int IdenticalCount { get; set; }

        public int MissingCount { get; set; }

        public int WarningCount { get; set; }

        public void SetDiffItems(IEnumerable<BrokerStatementDiffItemDto> items)
        {
            var sortedDiffItems = items
                .OrderBy(diffItem => diffItem.DiffType switch
                {
                    StatementDiffType.New => 1,
                    StatementDiffType.FieldDiscrepancy => 2,
                    StatementDiffType.Identical => 3,
                    StatementDiffType.MissingInStatement => 4,
                    _ => 5
                })
                .ThenByDescending(diffItem => diffItem.TradeDateTime)
                .ToList();

            DiffItems = sortedDiffItems;

            var newCount = 0;
            var discrepancyCount = 0;
            var identicalCount = 0;
            var missingCount = 0;
            var warningCount = 0;

            foreach (var diffItem in sortedDiffItems)
            {
                if (diffItem.HasWarning)
                {
                    warningCount++;
                }

                switch (diffItem.DiffType)
                {
                    case StatementDiffType.New:
                        if (!diffItem.HasWarning)
                        {
                            newCount++;
                        }
                        break;
                    case StatementDiffType.FieldDiscrepancy:
                        discrepancyCount++;
                        break;
                    case StatementDiffType.Identical:
                        identicalCount++;
                        break;
                    case StatementDiffType.MissingInStatement:
                        missingCount++;
                        break;
                }
            }

            NewCount = newCount;
            DiscrepancyCount = discrepancyCount;
            IdenticalCount = identicalCount;
            MissingCount = missingCount;
            WarningCount = warningCount;
        }
    }
}
