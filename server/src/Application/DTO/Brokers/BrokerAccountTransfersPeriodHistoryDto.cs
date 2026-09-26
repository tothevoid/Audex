using System.Collections.Generic;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountMonthTransfersHistoryDto
    {
        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public List<BrokerAccountTransferAccountValueDto> Accounts { get; set; } = new();

        public List<BrokerAccountDayTransferDto> Days { get; set; } = new();
    }

    public class BrokerAccountYearTransfersHistoryDto
    {
        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public List<BrokerAccountTransferAccountValueDto> Accounts { get; set; } = new();

        public List<BrokerAccountMonthTransferDto> Months { get; set; } = new();
    }
}
