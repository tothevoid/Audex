using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.Json;
using System.Threading.Tasks;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Notifications;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Mappings;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Notifications;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Interfaces.Messages;
using Audex.Infrastructure.Queries;
using Audex.Shared.Common;

namespace Audex.Application.Services.Notifications
{
    public class NotificationService(
        IUnitOfWork uow,
        ApplicationMapper mapper,
        IServerNotifier serverNotifier) : INotificationService
    {
        private readonly IUnitOfWork _db = uow;
        private readonly IRepository<Notification> _notificationRepo = uow.CreateRepository<Notification>();
        private readonly ApplicationMapper _mapper = mapper;
        private readonly IServerNotifier _serverNotifier = serverNotifier;

        private static Expression<Func<Notification, bool>> GetNotificationFilter(NotificationFilterDto filter)
        {
            var onlyUnread = filter?.OnlyUnread ?? false;
            var category = filter?.Category;
            var hasCategory = !string.IsNullOrEmpty(category) && category != "All";
            return notification => notification.UserProfileId == UserProfileConstants.UserProfileId &&
                                   (!onlyUnread || !notification.IsRead) &&
                                   (!hasCategory || notification.Category == category);
        }

        public async Task<PagedResult<NotificationDto>> GetAllAsync(NotificationFilterDto filter)
        {
            var filterExpression = GetNotificationFilter(filter);
            var builder = new ComplexQueryBuilder<Notification>()
                .AddFilter(filterExpression)
                .AddPagination(filter, notification => notification.CreatedAt, isDescending: true);

            var pagedNotifications = await _notificationRepo.GetPagedAsync(builder.GetQuery());
            return _mapper.Map(pagedNotifications);
        }

        public async Task<int> GetUnreadCountAsync()
        {
            var unread = await _notificationRepo.GetAllAsync(
                filter: notification => notification.UserProfileId == UserProfileConstants.UserProfileId && !notification.IsRead,
                disableTracking: true);

            return unread.Count();
        }

        public async Task CleanUpOldNotificationsAsync(int olderThanDays = 90)
        {
            var threshold = DateTime.UtcNow.AddDays(-olderThanDays);
            var oldReadNotifications = (await _notificationRepo.GetAllAsync(
                filter: notification => notification.UserProfileId == UserProfileConstants.UserProfileId && notification.IsRead && notification.CreatedAt < threshold,
                disableTracking: false)).ToList();

            if (oldReadNotifications.Count == 0) return;

            foreach (var item in oldReadNotifications)
            {
                await _notificationRepo.DeleteAsync(item.Id);
            }

            await _db.CommitAsync();
        }

        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        private static string BuildNotificationReceivedMessage(NotificationDto dto) =>
            $"{{\"type\":\"NotificationReceived\",\"payload\":{JsonSerializer.Serialize(dto, JsonOptions)}}}";

        private static string BuildNotificationReadMessage(Guid notificationId) =>
            $"{{\"type\":\"NotificationRead\",\"notificationId\":\"{notificationId}\"}}";

        private static string BuildAllNotificationsReadMessage() =>
            "{\"type\":\"AllNotificationsRead\"}";

        public async Task<NotificationDto> CreateAsync(
            string title,
            string message,
            NotificationSeverity severity = NotificationSeverity.Info,
            string actionUrl = null,
            string category = "System",
            Guid? userProfileId = null)
        {
            var entity = new Notification
            {
                Id = Guid.NewGuid(),
                UserProfileId = userProfileId ?? UserProfileConstants.UserProfileId,
                Title = title,
                Message = message,
                Severity = severity,
                ActionUrl = actionUrl,
                Category = category,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(entity);
            await _db.CommitAsync();

            var dto = _mapper.Map(entity);
            await _serverNotifier.SendToAllAsync(BuildNotificationReceivedMessage(dto));
            return dto;
        }

        public async Task MarkAsReadAsync(Guid notificationId)
        {
            var item = await _notificationRepo.GetByIdAsync(notificationId, disableTracking: false);
            if (item != null && !item.IsRead)
            {
                item.IsRead = true;
                item.ReadAt = DateTime.UtcNow;
                _notificationRepo.Update(item);
                await _db.CommitAsync();

                await _serverNotifier.SendToAllAsync(BuildNotificationReadMessage(notificationId));
            }
        }

        public async Task MarkAllAsReadAsync()
        {
            var unreadItems = (await _notificationRepo.GetAllAsync(
                filter: notification => notification.UserProfileId == UserProfileConstants.UserProfileId && !notification.IsRead,
                disableTracking: false)).ToList();

            if (unreadItems.Count == 0) return;

            var now = DateTime.UtcNow;
            foreach (var item in unreadItems)
            {
                item.IsRead = true;
                item.ReadAt = now;
                _notificationRepo.Update(item);
            }

            await _db.CommitAsync();
            await _serverNotifier.SendToAllAsync(BuildAllNotificationsReadMessage());
        }

        public async Task DeleteAsync(Guid notificationId)
        {
            await _notificationRepo.DeleteAsync(notificationId);
            await _db.CommitAsync();
        }
    }
}
