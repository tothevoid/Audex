#nullable enable
using System;
using System.Text.Json.Serialization;
using Audex.WebApi.Models.Currencies;

namespace Audex.WebApi.Models.Securities
{
    public class SecurityModel
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("ticker")]
        public string Ticker { get; set; } = string.Empty;

        [JsonPropertyName("isin")]
        public string? Isin { get; set; }

        [JsonPropertyName("type")]
        public SecurityTypeModel? Type { get; set; }

        [JsonPropertyName("typeId")]
        public Guid TypeId { get; set; }

        [JsonPropertyName("actualPrice")]
        public decimal ActualPrice { get; set; }

        [JsonPropertyName("priceFetchedAt")]
        public DateTime? PriceFetchedAt { get; set; }

        [JsonPropertyName("iconKey")]
        public string? IconKey { get; set; }

        [JsonPropertyName("currency")]
        public CurrencyModel? Currency { get; set; }

        [JsonPropertyName("currencyId")]
        public Guid CurrencyId { get; set; }
    }
}
