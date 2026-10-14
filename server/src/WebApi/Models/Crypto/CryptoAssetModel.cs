using Audex.Shared.Entities;
using System;

namespace Audex.WebApi.Models.Crypto
{
    public class CryptoAssetModel : BaseEntity
    {
        public Guid CryptocurrencyId { get; set; }

        public CryptocurrencyModel Cryptocurrency { get; set; } = null!;

        public Guid CryptoAccountId { get; set; }

        public CryptoAccountModel CryptoAccount { get; set; } = null!;

        public decimal Quantity { get; set; }
    }
}
