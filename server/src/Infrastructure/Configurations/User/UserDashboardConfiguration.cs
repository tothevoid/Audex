using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Audex.Infrastructure.Entities.User;

namespace Audex.Infrastructure.Configurations.User
{
    public class UserDashboardConfiguration : IEntityTypeConfiguration<UserDashboard>
    {
        public void Configure(EntityTypeBuilder<UserDashboard> builder)
        {
            builder
                .HasOne(userDashboard => userDashboard.UserProfile)
                .WithMany()
                .HasForeignKey(userDashboard => userDashboard.UserProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder
                .Property(userDashboard => userDashboard.Title)
                .HasMaxLength(200)
                .IsRequired();

            builder
                .Property(userDashboard => userDashboard.LayoutJson)
                .IsRequired();
        }
    }
}
