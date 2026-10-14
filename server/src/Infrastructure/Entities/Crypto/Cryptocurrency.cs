using Audex.Shared.Entities;
using System.Collections.Generic;

namespace Audex.Infrastructure.Entities.Crypto
{
    public class Cryptocurrency : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Symbol { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string IconKey { get; set; } = string.Empty;

        public ICollection<CryptoAsset> CryptoAssets { get; set; } = [];
    }
}
