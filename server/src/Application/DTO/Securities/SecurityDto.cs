#nullable enable
using System;
using Audex.Application.DTO.Currencies;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.Securities
{
    public class SecurityDto: BaseEntity
    {
        public string Name { get; set; }

        public string Ticker { get; set; }

        public string? Isin { get; set; }

        public SecurityTypeDto Type { get; set; }

        public Guid TypeId { get; set; }

        public decimal ActualPrice { get; set; }

        public DateTime? PriceFetchedAt { get; set; }

        public string IconKey { get; set; }

        public CurrencyDto Currency { get; set; }

        public Guid CurrencyId { get; set; }
    }
}
