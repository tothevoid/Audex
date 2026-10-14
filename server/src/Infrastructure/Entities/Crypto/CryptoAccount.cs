using Audex.Shared.Entities;
using System;
using System.Collections.Generic;

namespace Audex.Infrastructure.Entities.Crypto
{
    public class CryptoAccount : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public Guid CryptoProviderId { get; set; }

        public CryptoProvider CryptoProvider { get; set; } = null!;

        public ICollection<CryptoAsset> CryptoAssets { get; set; } = [];
    }
}
