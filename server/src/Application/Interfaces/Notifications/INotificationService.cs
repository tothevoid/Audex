using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Notifications;
using Audex.Infrastructure.Entities.Notifications;
using Audex.Shared.Common;

namespace Audex.Application.Interfaces.Notifications
{
    public interface INotificationService
    {
        Task<PagedResult<NotificationDto>> GetAllAsync(NotificationFilterDto filter);

        Task<int> GetUnreadCountAsync();

        Task<NotificationDto> CreateAsync(
            string title,
            string message,
            NotificationSeverity severity = NotificationSeverity.Info,
            string actionUrl = null,
            string category = "System",
            Guid? userProfileId = null);

        Task MarkAsReadAsync(Guid notificationId);

        Task MarkAllAsReadAsync();

        Task DeleteAsync(Guid notificationId);

        Task CleanUpOldNotificationsAsync(int olderThanDays = 90);
    }
}

