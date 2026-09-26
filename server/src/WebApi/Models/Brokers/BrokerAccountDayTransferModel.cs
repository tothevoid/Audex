using System.Collections.Generic;

namespace Audex.WebApi.Models.Brokers
{
    public class BrokerAccountDayTransferModel
    {
        public int DayIndex { get; set; }

        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public List<BrokerAccountTransferAccountValueModel> AccountValues { get; set; } = new();
    }
}

