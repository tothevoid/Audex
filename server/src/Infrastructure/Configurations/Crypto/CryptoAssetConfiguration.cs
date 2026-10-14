using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Audex.Infrastructure.Entities.Crypto;

namespace Audex.Infrastructure.Configurations.Crypto
{
    public class CryptoAssetConfiguration : IEntityTypeConfiguration<CryptoAsset>
    {
        public void Configure(EntityTypeBuilder<CryptoAsset> cryptoAssetConfiguration)
        {
            cryptoAssetConfiguration
                .HasOne(cryptoAsset => cryptoAsset.Cryptocurrency)
                .WithMany(cryptocurrency => cryptocurrency.CryptoAssets)
                .HasForeignKey(cryptoAsset => cryptoAsset.CryptocurrencyId)
                .OnDelete(DeleteBehavior.Restrict);

            cryptoAssetConfiguration
                .HasOne(cryptoAsset => cryptoAsset.CryptoAccount)
                .WithMany(cryptoAccount => cryptoAccount.CryptoAssets)
                .HasForeignKey(cryptoAsset => cryptoAsset.CryptoAccountId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
