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

        Task<DistributionWidgetDataDto> GetTotalBalanceWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetCashDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetBankAccountsDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetSecuritiesDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetDepositsDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetDepositIncomesDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetDebtsDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetCryptoDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetBanksDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetSpentsDistributionWidgetDataAsync();

        Task<DistributionWidgetDataDto> GetIncomesDistributionWidgetDataAsync();
    }
}
