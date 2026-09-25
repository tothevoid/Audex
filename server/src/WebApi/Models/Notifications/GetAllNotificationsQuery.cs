using Audex.Shared.Common;

namespace Audex.WebApi.Models.Notifications
{
    public class GetAllNotificationsQuery : BasePageable
    {
        public bool OnlyUnread { get; set; }
        public string Category { get; set; }
    }
}
