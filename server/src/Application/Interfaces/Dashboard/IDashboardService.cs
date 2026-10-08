using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard;
using Audex.Application.DTO.Dashboard.Widgets;

namespace Audex.Application.Interfaces.Dashboard
{
    public interface IDashboardService
    {
        Task<GlobalDashboardDto> GetDashboardAsync();
    }
}