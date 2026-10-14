using Audex.Shared.Entities;
using System;

namespace Audex.Application.DTO.Crypto
{
    public class CryptoAssetDto : BaseEntity
    {
        public Guid CryptocurrencyId { get; set; }

        public CryptocurrencyDto Cryptocurrency { get; set; } = null!;

        public Guid CryptoAccountId { get; set; }

        public CryptoAccountDto CryptoAccount { get; set; } = null!;

        public decimal Quantity { get; set; }
    }
}
