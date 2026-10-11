using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Interfaces.Dashboard;

namespace Audex.Application.Tests.Services.Dashboard
{
    public class DashboardServiceTests : TestBase
    {
        public DashboardServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetDashboard_ReturnsGlobalDashboardDto()
        {
            var dashboard = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDashboardService>();
                return await service.GetDashboardAsync();
            });

            //TODO: add mock data
            Assert.NotNull(dashboard);
            Assert.NotNull(dashboard.AccountsGlobalDashboard);
            Assert.NotNull(dashboard.BrokerAccountsGlobalDashboard);
            Assert.NotNull(dashboard.DebtsGlobalDashboard);
            Assert.NotNull(dashboard.DepositsGlobalDashboard);
            Assert.NotNull(dashboard.TransactionsGlobalDashboard);
            Assert.NotNull(dashboard.CryptoAccountsGlobalDashboard);
            Assert.NotNull(dashboard.BanksGlobalDashboard);
        }
    }
}
