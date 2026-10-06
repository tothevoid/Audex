using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Dashboard;
using Audex.Application.Interfaces.Integrations.Oil;
using Audex.Application.Interfaces.User;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Tests.Shared.Mock;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Audex.Application.Tests.Services.Dashboard
{
    public class DashboardWidgetsServiceTests : TestBase
    {
        public DashboardWidgetsServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetOilWidget_WithNoCustomSettings_QueriesDefaultOilSymbols()
        {
            var userId = UserProfileConstants.UserProfileId;
            var dashboardId = Guid.NewGuid();
            var widgetId = "oil-widget-1";

            var result = await ExecuteScopeAsync(async serviceProvider =>
            {
                var mockConnector = (MockOilConnector)serviceProvider.GetRequiredService<IOilConnector>();
                mockConnector.GetOilQuotesHandler = symbols =>
                {
                    var requestedList = (symbols != null && symbols.Any()) ? symbols.ToList() : new List<string> { "BRENT", "WTI" };
                    return Task.FromResult<IEnumerable<OilQuoteDto>>(
                        requestedList.Select(sym => new OilQuoteDto
                        {
                            Symbol = sym,
                            Price = 75.50m,
                            Change = 1.25m,
                            ChangePercent = 1.68m,
                            Currency = "USD",
                            Source = "Yahoo Finance",
                            LastTradeTime = DateTime.UtcNow
                        })
                    );
                };

                var widgetsService = serviceProvider.GetRequiredService<IDashboardWidgetsService>();
                return await widgetsService.GetOilWidgetAsync(userId, dashboardId, widgetId);
            });

            Assert.NotNull(result);
            Assert.Equal(2, result.Quotes.Count);
            Assert.Contains(result.Quotes, quote => quote.Symbol == "BRENT");
            Assert.Contains(result.Quotes, quote => quote.Symbol == "WTI");
        }

        [Fact]
        public async Task TestGetOilWidget_WithCustomWidgetSettings_ExtractsSymbolsAndQueriesConnector()
        {
            var userId = UserProfileConstants.UserProfileId;
            const string widgetId = "custom-oil-1";
            const string layoutJson = "[{\"id\":\"custom-oil-1\",\"type\":\"Oil\",\"settings\":{\"symbols\":[\"BRENT\"]}}]";

            var result = await ExecuteScopeAsync(async serviceProvider =>
            {
                var userDashboardService = serviceProvider.GetRequiredService<IUserDashboardService>();
                var dashboard = await userDashboardService.CreateAsync(userId, "Нефтяной дашборд", layoutJson);

                var mockConnector = (MockOilConnector)serviceProvider.GetRequiredService<IOilConnector>();
                mockConnector.GetOilQuotesHandler = symbols =>
                {
                    var requestedList = (symbols != null && symbols.Any()) ? symbols.ToList() : new List<string> { "BRENT", "WTI" };
                    return Task.FromResult<IEnumerable<OilQuoteDto>>(
                        requestedList.Select(sym => new OilQuoteDto
                        {
                            Symbol = sym,
                            Price = 75.50m,
                            Currency = "USD",
                            Source = "MOEX",
                            LastTradeTime = DateTime.UtcNow
                        })
                    );
                };

                var widgetsService = serviceProvider.GetRequiredService<IDashboardWidgetsService>();
                return await widgetsService.GetOilWidgetAsync(userId, dashboard.Id, widgetId);
            });

            Assert.NotNull(result);
            Assert.Single(result.Quotes);
            Assert.Equal("BRENT", result.Quotes[0].Symbol);
        }

        [Fact]
        public async Task TestGetOilWidget_WhenDashboardNotFound_FallsBackToDefaults()
        {
            var userId = UserProfileConstants.UserProfileId;
            var nonExistentDashboardId = Guid.NewGuid();

            var result = await ExecuteScopeAsync(async serviceProvider =>
            {
                var mockConnector = (MockOilConnector)serviceProvider.GetRequiredService<IOilConnector>();
                mockConnector.GetOilQuotesHandler = symbols =>
                {
                    var requestedList = (symbols != null && symbols.Any()) ? symbols.ToList() : new List<string> { "BRENT", "WTI" };
                    return Task.FromResult<IEnumerable<OilQuoteDto>>(
                        requestedList.Select(sym => new OilQuoteDto
                        {
                            Symbol = sym,
                            Price = 50m,
                            Currency = "USD",
                            Source = "Yahoo Finance",
                            LastTradeTime = DateTime.UtcNow
                        })
                    );
                };

                var widgetsService = serviceProvider.GetRequiredService<IDashboardWidgetsService>();
                return await widgetsService.GetOilWidgetAsync(userId, nonExistentDashboardId, "missing-widget");
            });

            Assert.NotNull(result);
            Assert.Equal(2, result.Quotes.Count);
        }
    }
}
