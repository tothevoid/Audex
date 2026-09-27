using Audex.Shared.Common;

namespace Audex.Application.DTO.Notifications
{
    public class NotificationFilterDto : BasePageable
    {
        public bool OnlyUnread { get; set; }

        public string Category { get; set; }
    }
}
