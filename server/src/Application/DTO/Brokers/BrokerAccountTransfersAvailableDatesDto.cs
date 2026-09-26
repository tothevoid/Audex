using System.Collections.Generic;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountTransfersAvailableDatesDto
    {
        public List<int> AvailableYears { get; set; } = new();

        public Dictionary<int, List<int>> AvailableMonthsByYear { get; set; } = new();
    }
}
