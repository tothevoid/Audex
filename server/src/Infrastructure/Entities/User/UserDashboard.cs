using System;
using Audex.Infrastructure.Entities.User;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Entities.User
{
    public class UserDashboard : BaseEntity
    {
        public Guid UserProfileId { get; set; }

        public UserProfile UserProfile { get; set; }

        public string Title { get; set; }

        public bool IsDefault { get; set; }

        public int Order { get; set; }

        public string LayoutJson { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
