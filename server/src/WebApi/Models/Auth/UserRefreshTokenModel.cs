#nullable enable
using System;

namespace Audex.WebApi.Models.Auth
{
    public class UserRefreshTokenModel
    {
        public Guid Id { get; set; }

        public string? CreatedByIp { get; set; }

        public string? UserAgent { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime ExpiresAt { get; set; }

        public bool IsCurrent { get; set; }

        public bool IsRevoked { get; set; }

        public bool IsUsed { get; set; }
    }
}
