#nullable enable
using System;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class MarketIndexQuoteDto
    {
        public string Code { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string ShortName { get; set; } = string.Empty;

        public decimal Value { get; set; }

        public decimal ChangePoints { get; set; }

        public decimal ChangePercent { get; set; }

        public string Currency { get; set; } = string.Empty;

        public int Decimals { get; set; } = 2;

        public string Source { get; set; } = string.Empty;

        public DateTime? LastUpdateTime { get; set; }
    }
}
