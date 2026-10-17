#nullable enable
using System;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class BrokerPnlWidgetDto
    {
        public decimal DailyAbsoluteChange { get; set; }

        public decimal DailyPercentageChange { get; set; }

        public decimal TotalAbsolutePnl { get; set; }

        public decimal TotalPercentagePnl { get; set; }

        public string CurrencyName { get; set; } = string.Empty;

        public string? SelectedAccountName { get; set; }

        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    }
}
