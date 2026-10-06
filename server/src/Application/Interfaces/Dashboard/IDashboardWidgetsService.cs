using System;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;

namespace Audex.Application.Interfaces.Dashboard
{
    public interface IDashboardWidgetsService
    {
        Task<OilWidgetDto> GetOilWidgetAsync(Guid userId, Guid dashboardId, string widgetId);
    }
}
