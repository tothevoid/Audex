#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Dashboard;
using Audex.Application.Interfaces.Integrations.Oil;
using Audex.Application.Utilities.Dashboard;
using Audex.Infrastructure.Entities.User;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Dashboard
{
    public class DashboardWidgetsService : IDashboardWidgetsService
    {
        private readonly IRepository<UserDashboard> _userDashboardRepository;
        private readonly IOilConnector _oilConnector;

        public DashboardWidgetsService(
            IUnitOfWork unitOfWork,
            IOilConnector oilConnector)
        {
            _userDashboardRepository = unitOfWork.CreateRepository<UserDashboard>();
            _oilConnector = oilConnector;
        }

        public async Task<OilWidgetDto> GetOilWidgetAsync(Guid userId, OilWidgetRequestDto request)
        {
            var targetSymbols = request.Symbols.Count > 0
                ? request.Symbols
                : (await GetWidgetSettingsAsync<OilWidgetSettingsDto>(userId, request.DashboardId, request.WidgetId))?.Symbols;

            var quotes = (await _oilConnector.GetOilQuotesAsync(targetSymbols)).ToList();

            return new OilWidgetDto
            {
                Quotes = quotes
            };
        }

        public Task<IReadOnlyList<string>> GetSupportedOilSymbolsAsync()
        {
            return _oilConnector.GetSupportedSymbolsAsync();
        }

        private async Task<TSettings?> GetWidgetSettingsAsync<TSettings>(Guid userId, Guid dashboardId, string widgetId)
            where TSettings : class
        {
            if (dashboardId == Guid.Empty || string.IsNullOrWhiteSpace(widgetId))
            {
                return null;
            }

            var dashboardEntity = await _userDashboardRepository.GetByIdAsync(dashboardId, disableTracking: true);
            if (dashboardEntity == null || dashboardEntity.UserProfileId != userId || string.IsNullOrWhiteSpace(dashboardEntity.LayoutJson))
            {
                return null;
            }

            return DashboardLayoutValidator.ExtractWidgetSettings<TSettings>(dashboardEntity.LayoutJson, widgetId);
        }
    }
}
