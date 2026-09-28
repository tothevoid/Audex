#nullable enable
using Audex.Shared.Common;
using System;

namespace Audex.Application.DTO.Auth
{
    public class UserRefreshTokenFilterDto : BasePageable
    {
        public Guid UserProfileId { get; set; }
        public bool IsOnlyActive { get; set; } = true;
        public string? CurrentRefreshToken { get; set; }
    }
}
