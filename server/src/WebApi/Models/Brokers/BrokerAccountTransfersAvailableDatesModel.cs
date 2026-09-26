using System.Collections.Generic;

namespace Audex.WebApi.Models.Brokers
{
    public class BrokerAccountTransfersAvailableDatesModel
    {
        public List<int> AvailableYears { get; set; } = new();

        public Dictionary<int, List<int>> AvailableMonthsByYear { get; set; } = new();
    }
}
