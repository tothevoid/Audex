using Audex.Shared.Entities;
using System;

namespace Audex.Infrastructure.Entities.Crypto
{
    public class CryptoAsset : BaseEntity
    {
        public Guid CryptocurrencyId { get; set; }

        public Cryptocurrency Cryptocurrency { get; set; } = null!;

        public Guid CryptoAccountId { get; set; }

        public CryptoAccount CryptoAccount { get; set; } = null!;

        public decimal Quantity { get; set; }
    }
}
