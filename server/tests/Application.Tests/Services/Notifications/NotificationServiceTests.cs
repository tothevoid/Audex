using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Notifications;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Entities.Notifications;
using Xunit;

namespace Audex.Application.Tests.Services.Notifications
{
    public class NotificationServiceTests : TestBase
    {
        public NotificationServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestCreateAndGetAll_ReturnsCreatedNotification()
        {
            var created = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.CreateAsync(
                    title: "Test Notification",
                    message: "This is a test notification message",
                    severity: NotificationSeverity.Info,
                    actionUrl: "/broker_accounts",
                    category: "Broker");
            });

            Assert.NotNull(created);
            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal("Test Notification", created.Title);
            Assert.Equal("This is a test notification message", created.Message);
            Assert.Equal(NotificationSeverity.Info, created.Severity);
            Assert.Equal("/broker_accounts", created.ActionUrl);
            Assert.Equal("Broker", created.Category);
            Assert.False(created.IsRead);
            Assert.Null(created.ReadAt);

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetAllAsync(new NotificationFilterDto());
            });

            Assert.NotNull(pagedResult);
            Assert.True(pagedResult.TotalCount > 0);
            Assert.Contains(pagedResult.Items, notification => notification.Id == created.Id);
        }

        [Fact]
        public async Task TestGetUnreadCount_ReturnsPositiveCountForUnreadNotifications()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.CreateAsync("Unread Notification", "Message", NotificationSeverity.Warning);
            });

            var unreadCount = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetUnreadCountAsync();
            });

            Assert.True(unreadCount > 0);
        }

        [Fact]
        public async Task TestMarkAsRead_UpdatesIsReadAndReadAt()
        {
            var notification = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.CreateAsync("Unread Notification", "Message", NotificationSeverity.Warning);
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                await service.MarkAsReadAsync(notification.Id);
            });

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetAllAsync(new NotificationFilterDto());
            });

            var updated = pagedResult.Items.FirstOrDefault(item => item.Id == notification.Id);
            Assert.NotNull(updated);
            Assert.True(updated.IsRead);
            Assert.NotNull(updated.ReadAt);
        }

        [Fact]
        public async Task TestMarkAllAsRead()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                await service.CreateAsync("Notification 1", "Msg 1", NotificationSeverity.Info);
                await service.CreateAsync("Notification 2", "Msg 2", NotificationSeverity.Danger);
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                await service.MarkAllAsReadAsync();
            });

            var unreadCount = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetUnreadCountAsync();
            });

            Assert.Equal(0, unreadCount);
        }

        [Fact]
        public async Task TestDelete()
        {
            var notification = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.CreateAsync("To Delete", "Delete Msg", NotificationSeverity.Success);
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                await service.DeleteAsync(notification.Id);
            });

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetAllAsync(new NotificationFilterDto());
            });

            Assert.DoesNotContain(pagedResult.Items, item => item.Id == notification.Id);
        }

        [Fact]
        public async Task TestCleanUpOldNotifications_RemovesOnlyOldReadNotifications()
        {
            var notification = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                var created = await service.CreateAsync("Old Notification", "To be cleaned", NotificationSeverity.Info);
                await service.MarkAsReadAsync(created.Id);
                return created;
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                // Clean with olderThanDays: -1 (all read notifications before tomorrow)
                await service.CleanUpOldNotificationsAsync(olderThanDays: -1);
            });

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetAllAsync(new NotificationFilterDto { RecordsQuantity = 100 });
            });

            Assert.DoesNotContain(pagedResult.Items, item => item.Id == notification.Id);
        }

        [Fact]
        public async Task TestGetAllAsync_WithFilterAndPagination_ReturnsPagedResult()
        {
            var notification = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.CreateAsync("Paginated Notification", "Msg", NotificationSeverity.Info, category: "TestCategory");
            });

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<INotificationService>();
                return await service.GetAllAsync(new NotificationFilterDto
                {
                    Category = "TestCategory",
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            Assert.NotNull(pagedResult);
            Assert.Equal(1, pagedResult.PageIndex);
            Assert.Equal(10, pagedResult.PageSize);
            Assert.True(pagedResult.TotalCount >= 1);
            Assert.Contains(pagedResult.Items, item => item.Id == notification.Id);
        }
    }
}

