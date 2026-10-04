#nullable enable
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.User;

namespace Audex.Application.Interfaces.User
{
    public interface IUserDashboardService
    {
        Task<IEnumerable<UserDashboardDto>> GetAllByUserIdAsync(Guid userId);

        Task<UserDashboardDto?> GetByIdAsync(Guid dashboardId, Guid userId);

        Task<UserDashboardDto> CreateAsync(Guid userId, string title, string? initialLayoutJson = null);

        Task<UserDashboardDto?> UpdateLayoutAsync(Guid dashboardId, Guid userId, string layoutJson);

        Task<UserDashboardDto?> RenameAsync(Guid dashboardId, Guid userId, string newTitle);

        Task<bool> DeleteAsync(Guid dashboardId, Guid userId);

        Task<bool> SetDefaultAsync(Guid dashboardId, Guid userId);

        Task<UserDashboardDto> GetOrCreateDefaultDashboardAsync(Guid userId);
    }
}
