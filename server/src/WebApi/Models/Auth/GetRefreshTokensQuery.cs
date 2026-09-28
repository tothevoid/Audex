using Audex.Shared.Common;

namespace Audex.WebApi.Models.Auth
{
    public class GetRefreshTokensQuery : BasePageable
    {
        public bool IsOnlyActive { get; set; } = true;
    }
}
