#nullable enable
using System;

namespace Audex.Application.DTO.Securities
{
    public class MarketSecurityInfoDto
    {
        public string Ticker { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string? Isin { get; set; }

        public Guid TypeId { get; set; }

        public Guid CurrencyId { get; set; }

        public decimal? LastPrice { get; set; }
    }
}
