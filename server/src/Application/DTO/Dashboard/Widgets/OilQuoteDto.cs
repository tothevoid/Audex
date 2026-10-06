using System;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class OilQuoteDto
    {
        public string Symbol { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal Change { get; set; }

        public decimal ChangePercent { get; set; }

        public string Currency { get; set; } = string.Empty;

        public string Source { get; set; } = string.Empty;

        public DateTime LastTradeTime { get; set; }
    }
}
