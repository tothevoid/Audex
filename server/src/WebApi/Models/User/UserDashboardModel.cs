using System;
using Audex.Shared.Entities;

namespace Audex.WebApi.Models.User
{
    public class UserDashboardModel : BaseEntity
    {
        public Guid UserProfileId { get; set; }

        public string Title { get; set; }

        public bool IsDefault { get; set; }

        public int Order { get; set; }

        public string LayoutJson { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }

    public class CreateUserDashboardModel
    {
        public string Title { get; set; }

        public string LayoutJson { get; set; }
    }

    public class UpdateUserDashboardLayoutModel
    {
        public Guid Id { get; set; }

        public string LayoutJson { get; set; }
    }

    public class RenameUserDashboardModel
    {
        public Guid Id { get; set; }

        public string Title { get; set; }
    }
}
