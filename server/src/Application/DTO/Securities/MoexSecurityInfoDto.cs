#nullable enable
using System;

namespace Audex.Application.DTO.Securities
{
    public class MoexSecurityInfoDto
    {
        public string Ticker { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string? Isin { get; set; }

        public Guid TypeId { get; set; }

        public string TypeName { get; set; } = string.Empty;

        public Guid CurrencyId { get; set; }

        public string CurrencyName { get; set; } = string.Empty;

        public decimal? LastPrice { get; set; }
    }
}
