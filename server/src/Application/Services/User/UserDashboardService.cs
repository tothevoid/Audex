#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
            var defaultLayoutJson = await GetDefaultLayoutJsonAsync(userId);
            return await CreateAsync(userId, defaultTitle, defaultLayoutJson);
        }

        private async Task<string> GetDefaultLayoutJsonAsync(Guid userId)
        {
            var totalBalanceTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetTotalBalanceTitle, userId);
            var cashTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetCashTitle, userId);
            var securitiesTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetSecuritiesTitle, userId);
            var depositsTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetDepositsTitle, userId);
            var depositIncomesTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetDepositIncomesTitle, userId);
            var bankAccountsTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetBankAccountsTitle, userId);
            var debtsTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetDebtsTitle, userId);
            var cryptoTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetCryptoTitle, userId);
            var banksTitle = await _localizationService.GetForUserAsync(LocalizationKeys.Dashboard.WidgetBanksTitle, userId);

            var defaultWidgets = new[]
            {
                new
                {
                    id = "widget-32d38598-032f-4f3c-b1c0-62891d7d1d98",
                    type = "TotalBalance",
                    title = totalBalanceTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 0, y = 0, w = 12, h = 4, minW = 4, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-c6ff7130-ad47-4121-9d9a-a56e7e457599",
                    type = "CashDistribution",
                    title = cashTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 0, y = 4, w = 6, h = 4, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-e7172bc0-4756-46fd-ae68-96977c082e2c",
                    type = "SecuritiesDistribution",
                    title = securitiesTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 6, y = 4, w = 6, h = 4, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-ca8ece62-d950-45b4-898a-a3308f60f4d1",
                    type = "DepositsDistribution",
                    title = depositsTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 0, y = 8, w = 6, h = 5, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-8f77995c-a544-41c3-880f-ffe9808bbb6a",
                    type = "DepositIncomesDistribution",
                    title = depositIncomesTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 6, y = 8, w = 6, h = 5, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-cc763f13-f964-4d87-9867-c500671862c6",
                    type = "BankAccountsDistribution",
                    title = bankAccountsTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 0, y = 13, w = 6, h = 5, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-36ffcfc0-396c-4c4d-99f6-d6bfdf8c5b1b",
                    type = "DebtsDistribution",
                    title = debtsTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 6, y = 13, w = 6, h = 5, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-c59405a1-4575-452d-944e-351e429b83cd",
                    type = "CryptoDistribution",
                    title = cryptoTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 0, y = 18, w = 6, h = 4, minW = 3, minH = 3 },
                    settings = new { }
                },
                new
                {
                    id = "widget-62757747-d7be-484e-9423-8d64824ac503",
                    type = "BanksDistribution",
                    title = banksTitle,
                    refreshIntervalSeconds = 0,
                    grid = new { x = 6, y = 18, w = 6, h = 4, minW = 3, minH = 3 },
                    settings = new { }
                }
            };

            return JsonSerializer.Serialize(defaultWidgets);
        }
    }
}
