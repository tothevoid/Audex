using Audex.Infrastructure.Entities.Securities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Audex.Infrastructure.Configurations.Securities
{
    public class SecurityPriceHistoryConfiguration : IEntityTypeConfiguration<SecurityPriceHistory>
    {
        public void Configure(EntityTypeBuilder<SecurityPriceHistory> builder)
        {
            builder.ToTable("SecurityPriceHistories");

            builder.Property(priceHistory => priceHistory.ClosePrice)
                .HasPrecision(18, 4);

            builder.HasIndex(priceHistory => new { priceHistory.SecurityId, priceHistory.Date })
                .IsUnique();

            builder.HasOne(priceHistory => priceHistory.Security)
                .WithMany(security => security.SecurityPriceHistories)
                .HasForeignKey(priceHistory => priceHistory.SecurityId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
