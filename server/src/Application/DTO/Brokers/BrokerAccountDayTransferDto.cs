using System.Collections.Generic;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountDayTransferDto
    {
        public int DayIndex { get; set; }

        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public List<BrokerAccountTransferAccountValueDto> AccountValues { get; set; } = new();
    }
}

