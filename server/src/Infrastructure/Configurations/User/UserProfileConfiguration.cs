using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Audex.Infrastructure.Entities.User;

namespace Audex.Infrastructure.Configurations.User
{
    public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
    {
        public void Configure(EntityTypeBuilder<UserProfile> userProfileConfiguration)
        {
            userProfileConfiguration
                .HasOne(userProfile => userProfile.Currency)
                .WithMany(currency => currency.UserProfiles)
                .HasForeignKey(userProfile => userProfile.CurrencyId)
                .OnDelete(DeleteBehavior.Restrict);

            userProfileConfiguration
                .Property(profile => profile.TimeZoneId)
                .HasMaxLength(100)
                .HasDefaultValue("Europe/Moscow");
        }
    }
}