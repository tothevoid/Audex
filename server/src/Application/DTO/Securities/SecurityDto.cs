#nullable enable
using System;
using Audex.Application.DTO.Currencies;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.Securities
{
    public class SecurityDto : BaseEntity
    {
        private string _name = string.Empty;
        public string Name
        {
            get => _name;
            set => _name = value?.Trim() ?? string.Empty;
        }

        private string _ticker = string.Empty;
        public string Ticker
        {
            get => _ticker;
            set => _ticker = value?.Trim() ?? string.Empty;
        }

        public string? Isin { get; set; }

        public SecurityTypeDto? Type { get; set; }

        public Guid TypeId { get; set; }

        public decimal ActualPrice { get; set; }

        public DateTime? PriceFetchedAt { get; set; }

        public string? IconKey { get; set; }

        public CurrencyDto? Currency { get; set; }

        public Guid CurrencyId { get; set; }
    }
}
