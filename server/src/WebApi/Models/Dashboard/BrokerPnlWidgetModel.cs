#nullable enable
using System;

namespace Audex.WebApi.Models.Dashboard
{
    public class BrokerPnlWidgetModel
    {
        public decimal DailyAbsoluteChange { get; set; }

        public decimal DailyPercentageChange { get; set; }

        public decimal TotalAbsolutePnl { get; set; }

        public decimal TotalPercentagePnl { get; set; }

        public string CurrencyName { get; set; } = string.Empty;

        public string? SelectedAccountName { get; set; }

        public DateTime FetchedAt { get; set; }
    }
}
