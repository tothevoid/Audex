#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.User;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.User;
using Audex.Application.Mappings;
using Audex.Application.Utilities;
using Audex.Application.Utilities.Dashboard;
using Audex.Infrastructure.Entities.User;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.User
{
    public class UserDashboardService : IUserDashboardService
    {
        private const string EmptyLayoutJson = "[]";

        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<UserDashboard> _userDashboardRepository;
        private readonly ILocalizationService _localizationService;
        private readonly ApplicationMapper _applicationMapper;

        public UserDashboardService(
            IUnitOfWork unitOfWork,
            ILocalizationService localizationService,
            ApplicationMapper applicationMapper)
        {
            _unitOfWork = unitOfWork;
            _localizationService = localizationService;
            _applicationMapper = applicationMapper;
            _userDashboardRepository = unitOfWork.CreateRepository<UserDashboard>();
        }

        public async Task<IEnumerable<UserDashboardDto>> GetAllByUserIdAsync(Guid userId)
        {
            var dashboards = await _userDashboardRepository.GetAllAsync(
                dashboard => dashboard.UserProfileId == userId,
                disableTracking: true);

            var orderedDashboards = dashboards
                .OrderByDescending(dashboard => dashboard.IsDefault)
                .ThenBy(dashboard => dashboard.Order)
                .ThenBy(dashboard => dashboard.CreatedAt);

            return _applicationMapper.Map(orderedDashboards);
        }

        public async Task<UserDashboardDto?> GetByIdAsync(Guid dashboardId, Guid userId)
        {
            var dashboardEntity = await _userDashboardRepository.GetByIdAsync(dashboardId, disableTracking: true);
            if (dashboardEntity == null || dashboardEntity.UserProfileId != userId)
            {
                return null;
            }

            return _applicationMapper.Map(dashboardEntity);
        }

        public async Task<UserDashboardDto> CreateAsync(Guid userId, string title, string? initialLayoutJson = null)
        {
            var existingDashboards = await _userDashboardRepository.GetAllAsync(
                dashboard => dashboard.UserProfileId == userId,
                disableTracking: true);

            var isFirstDashboard = !existingDashboards.Any();
            var maxOrder = existingDashboards.Any() ? existingDashboards.Max(dashboard => dashboard.Order) : 0;
            var currentTimestamp = DateTime.UtcNow;

            var resolvedTitle = string.IsNullOrWhiteSpace(title)
                ? await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.DefaultTitle, userId)
                : title.Trim();

            if (!string.IsNullOrWhiteSpace(initialLayoutJson))
            {
                DashboardLayoutValidator.ValidateAndParse(initialLayoutJson);
            }

            var newDashboardEntity = new UserDashboard
            {
                Id = Guid.NewGuid(),
                UserProfileId = userId,
                Title = resolvedTitle,
                IsDefault = isFirstDashboard,
                Order = maxOrder + 1,
                LayoutJson = string.IsNullOrWhiteSpace(initialLayoutJson) ? EmptyLayoutJson : initialLayoutJson,
                CreatedAt = currentTimestamp,
                UpdatedAt = currentTimestamp
            };

            await _userDashboardRepository.AddAsync(newDashboardEntity);
            await _unitOfWork.CommitAsync();

            return _applicationMapper.Map(newDashboardEntity);
        }

        public async Task<UserDashboardDto?> UpdateLayoutAsync(Guid dashboardId, Guid userId, string layoutJson)
        {
            var dashboardEntity = await _userDashboardRepository.GetByIdAsync(dashboardId, disableTracking: false);
            if (dashboardEntity == null || dashboardEntity.UserProfileId != userId)
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(layoutJson))
            {
                DashboardLayoutValidator.ValidateAndParse(layoutJson);
            }

            dashboardEntity.LayoutJson = string.IsNullOrWhiteSpace(layoutJson) ? EmptyLayoutJson : layoutJson;
            dashboardEntity.UpdatedAt = DateTime.UtcNow;

            _userDashboardRepository.Update(dashboardEntity);
            await _unitOfWork.CommitAsync();

            return _applicationMapper.Map(dashboardEntity);
        }

        public async Task<UserDashboardDto?> RenameAsync(Guid dashboardId, Guid userId, string newTitle)
        {
            if (string.IsNullOrWhiteSpace(newTitle))
            {
                return null;
            }

            var dashboardEntity = await _userDashboardRepository.GetByIdAsync(dashboardId, disableTracking: false);
            if (dashboardEntity == null || dashboardEntity.UserProfileId != userId)
            {
                return null;
            }

            dashboardEntity.Title = newTitle.Trim();
            dashboardEntity.UpdatedAt = DateTime.UtcNow;

            _userDashboardRepository.Update(dashboardEntity);
            await _unitOfWork.CommitAsync();

            return _applicationMapper.Map(dashboardEntity);
        }

        public async Task<bool> DeleteAsync(Guid dashboardId, Guid userId)
        {
            var dashboards = await _userDashboardRepository.GetAllAsync(
                dashboard => dashboard.UserProfileId == userId,
                disableTracking: false);

            var dashboardList = dashboards.ToList();
            var targetDashboard = dashboardList.FirstOrDefault(dashboard => dashboard.Id == dashboardId);

            if (targetDashboard == null)
            {
                return false;
            }

            var wasDefault = targetDashboard.IsDefault;
            await _userDashboardRepository.DeleteAsync(targetDashboard.Id);

            if (wasDefault)
            {
                var remainingDashboard = dashboardList.FirstOrDefault(dashboard => dashboard.Id != dashboardId);
                if (remainingDashboard != null)
                {
                    remainingDashboard.IsDefault = true;
                    _userDashboardRepository.Update(remainingDashboard);
                }
            }

            await _unitOfWork.CommitAsync();
            return true;
        }

        public async Task<bool> SetDefaultAsync(Guid dashboardId, Guid userId)
        {
            var dashboards = await _userDashboardRepository.GetAllAsync(
                dashboard => dashboard.UserProfileId == userId,
                disableTracking: false);

            var dashboardList = dashboards.ToList();
            var targetDashboard = dashboardList.FirstOrDefault(dashboard => dashboard.Id == dashboardId);

            if (targetDashboard == null)
            {
                return false;
            }

            foreach (var dashboard in dashboardList)
            {
                var shouldBeDefault = dashboard.Id == dashboardId;
                if (dashboard.IsDefault != shouldBeDefault)
                {
                    dashboard.IsDefault = shouldBeDefault;
                    _userDashboardRepository.Update(dashboard);
                }
            }

            await _unitOfWork.CommitAsync();
            return true;
        }

        public async Task<UserDashboardDto> GetOrCreateDefaultDashboardAsync(Guid userId)
        {
            var dashboards = await _userDashboardRepository.GetAllAsync(
                dashboard => dashboard.UserProfileId == userId,
                disableTracking: false);

            var dashboardList = dashboards.ToList();
            var defaultDashboard = dashboardList.FirstOrDefault(dashboard => dashboard.IsDefault)
                ?? dashboardList.FirstOrDefault();

            if (defaultDashboard != null)
            {
                return _applicationMapper.Map(defaultDashboard);
            }

            var defaultTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.DefaultTitle, userId);
            return await CreateAsync(userId, defaultTitle, GetDefaultLayoutJson());
        }

        private static string GetDefaultLayoutJson()
        {
            return "[]";
        }
    }
}
