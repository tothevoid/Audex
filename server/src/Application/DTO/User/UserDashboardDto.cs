using System;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.User
{
    public class UserDashboardDto : BaseEntity
    {
        public Guid UserProfileId { get; set; }

        public string Title { get; set; }

        public bool IsDefault { get; set; }

        public int Order { get; set; }

        public string LayoutJson { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
