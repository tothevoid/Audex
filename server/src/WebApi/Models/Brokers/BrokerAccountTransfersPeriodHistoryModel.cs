using System.Collections.Generic;

namespace Audex.WebApi.Models.Brokers
{
    public class BrokerAccountMonthTransfersHistoryModel
    {
        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public List<BrokerAccountTransferAccountValueModel> Accounts { get; set; } = new();

        public List<BrokerAccountDayTransferModel> Days { get; set; } = new();
    }

    public class BrokerAccountYearTransfersHistoryModel
    {
        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public List<BrokerAccountTransferAccountValueModel> Accounts { get; set; } = new();

        public List<BrokerAccountMonthTransferModel> Months { get; set; } = new();
    }
}
