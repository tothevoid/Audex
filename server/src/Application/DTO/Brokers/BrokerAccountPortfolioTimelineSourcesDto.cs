using System;
using System.Collections.Generic;
using Audex.Application.DTO.Securities;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountPortfolioTimelineSourcesDto
    {
        public required IReadOnlyDictionary<DateOnly, List<SecurityTransactionDto>> TransactionsByDate { get; init; }

        public required IReadOnlyDictionary<DateOnly, List<BrokerAccountFundsTransferDto>> TransfersByDate { get; init; }

        public required IReadOnlyDictionary<DateOnly, List<DividendPaymentDto>> DividendsByDate { get; init; }

        public required IReadOnlyDictionary<DateOnly, List<BrokerAccountTaxDeductionDto>> TaxDeductionsByDate { get; init; }

        public required IReadOnlyList<Guid> DistinctSecurityIds { get; init; }

        public DateOnly? MinDate { get; init; }
    }
}
