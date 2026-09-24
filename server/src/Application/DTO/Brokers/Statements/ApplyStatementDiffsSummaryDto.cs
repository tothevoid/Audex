using System;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class ApplyStatementDiffsSummaryDto
    {
        public Guid BrokerAccountId { get; set; }

        public int CreatedTransactionsCount { get; set; }

        public int UpdatedTransactionsCount { get; set; }

        public int CreatedSecuritiesCount { get; set; }

        public int TotalProcessedCount => CreatedTransactionsCount + UpdatedTransactionsCount;
    }
}
