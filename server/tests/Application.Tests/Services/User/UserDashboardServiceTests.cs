using System;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.User;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Audex.Application.Tests.Services.User
{
    public class UserDashboardServiceTests : TestBase
    {
        public UserDashboardServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestCreate_CreatesFirstAsDefault_AndSecondAsNonDefault()
        {
            var userId = UserProfileConstants.UserProfileId;

            var firstDashboard = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Main");
            });

            Assert.NotNull(firstDashboard);
            Assert.Equal("Main", firstDashboard.Title);
            Assert.True(firstDashboard.IsDefault);

            var secondDashboard = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Crypto");
            });

            Assert.NotNull(secondDashboard);
            Assert.Equal("Crypto", secondDashboard.Title);
            Assert.False(secondDashboard.IsDefault);
        }

        [Fact]
        public async Task TestGetAllByUserId_ReturnsUserDashboards()
        {
            var userId = UserProfileConstants.UserProfileId;

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                await dashboardService.CreateAsync(userId, "Дашборд 1");
                await dashboardService.CreateAsync(userId, "Дашборд 2");
            });

            var dashboards = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return (await dashboardService.GetAllByUserIdAsync(userId)).ToList();
            });

            Assert.NotEmpty(dashboards);
            Assert.All(dashboards, dashboard => Assert.Equal(userId, dashboard.UserProfileId));
        }

        [Fact]
        public async Task TestGetById_ReturnsCorrectDashboard()
        {
            var userId = UserProfileConstants.UserProfileId;

            var created = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Поиск по Id");
            });

            var fetched = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.GetByIdAsync(created.Id, userId);
            });

            Assert.NotNull(fetched);
            Assert.Equal(created.Id, fetched.Id);
            Assert.Equal("Поиск по Id", fetched.Title);
        }

        [Fact]
        public async Task TestUpdateLayout_UpdatesLayoutJson()
        {
            var userId = UserProfileConstants.UserProfileId;
            const string newLayoutJson = "[{\"id\":\"w1\",\"type\":\"Oil\",\"grid\":{\"x\":0,\"y\":0,\"w\":6,\"h\":4}}]";

            var created = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Дашборд для верстки");
            });

            var updated = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.UpdateLayoutAsync(created.Id, userId, newLayoutJson);
            });

            Assert.NotNull(updated);
            Assert.Equal(newLayoutJson, updated.LayoutJson);
        }

        [Fact]
        public async Task TestRename_UpdatesDashboardTitle()
        {
            var userId = UserProfileConstants.UserProfileId;

            var created = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Старое имя");
            });

            var renamed = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.RenameAsync(created.Id, userId, "Новое имя");
            });

            Assert.NotNull(renamed);
            Assert.Equal("Новое имя", renamed.Title);
        }

        [Fact]
        public async Task TestSetDefault_SetsSingleDefaultDashboard()
        {
            var userId = UserProfileConstants.UserProfileId;

            var first = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Первый");
            });

            var second = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Второй");
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                await dashboardService.SetDefaultAsync(second.Id, userId);
            });

            var allDashboards = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return (await dashboardService.GetAllByUserIdAsync(userId)).ToList();
            });

            var updatedSecond = allDashboards.First(dashboard => dashboard.Id == second.Id);
            var updatedFirst = allDashboards.First(dashboard => dashboard.Id == first.Id);

            Assert.True(updatedSecond.IsDefault);
            Assert.False(updatedFirst.IsDefault);
        }

        [Fact]
        public async Task TestDelete_RemovesDashboard()
        {
            var userId = UserProfileConstants.UserProfileId;

            var created = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.CreateAsync(userId, "Для удаления");
            });

            var deleteResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.DeleteAsync(created.Id, userId);
            });

            Assert.True(deleteResult);

            var fetched = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                return await dashboardService.GetByIdAsync(created.Id, userId);
            });

            Assert.Null(fetched);
        }

        [Fact]
        public async Task TestGetOrCreateDefaultDashboard_ReturnsExistingOrCreatesNew()
        {
            var userId = UserProfileConstants.UserProfileId;

            var (defaultDashboard, expectedTitle) = await ExecuteScopeAsync(async serviceProvider =>
            {
                var dashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                var localizationService = serviceProvider.GetRequiredService<ILocalizationService>();
                var expected = await localizationService.GetForUserAsync(LocalizationKeys.Dashboard.DefaultTitle, userId);
                var dashboard = await dashboardService.GetOrCreateDefaultDashboardAsync(userId);
                return (dashboard, expected);
            });

            Assert.NotNull(defaultDashboard);
            Assert.Equal(expectedTitle, defaultDashboard.Title);
            Assert.True(defaultDashboard.IsDefault);
        }
    }
}
