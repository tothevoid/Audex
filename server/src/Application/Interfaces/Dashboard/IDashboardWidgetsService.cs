using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;

namespace Audex.Application.Interfaces.Dashboard
{
    public interface IDashboardWidgetsService
    {
        Task<OilWidgetDto> GetOilWidgetAsync(Guid userId, OilWidgetRequestDto request);

        Task<IReadOnlyList<string>> GetSupportedOilSymbolsAsync();

        Task<IndicesWidgetDto> GetIndicesWidgetAsync(Guid userId, IndicesWidgetRequestDto request);

        Task<IReadOnlyList<string>> GetSupportedIndicesAsync();
    }
}
