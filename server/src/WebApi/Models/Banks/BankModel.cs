using Audex.Shared.Entities;
using System;
using System.Text.Json.Serialization;

namespace Audex.WebApi.Models.Banks
{
    public class BankModel
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("active")]
        public bool Active { get; set; } = true;

        [JsonPropertyName("iconKey")]
        public string IconKey { get; set; }
    }
}