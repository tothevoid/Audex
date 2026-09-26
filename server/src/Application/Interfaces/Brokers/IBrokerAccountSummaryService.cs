using Audex.Application.DTO.Brokers;
using Audex.Application.Services.Brokers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerAccountSummaryService
    {
        Task<BrokerAccountSummaryDto> GetSummaryAsync();

        Task<BrokerAccountSummaryDto> GetSummaryByBrokerAccountAsync(Guid brokerAccountId);

        Task<BrokerAccountDailyStatsDto> GetDailyStatsByBrokerAccountAsync(Guid brokerAccountId);

        Task<BrokerAccountDailyStatsDto> GetDailyStatsAsync();

        Task<BrokerAccountPortfolioDto> GetPortfolioValuesByBrokerAccountAsync(Guid brokerAccountId);

        Task<BrokerAccountPortfolioDto> GetPortfolioValuesAsync();

        Task<BrokerAccountMonthTransfersHistoryDto> GetMonthTransfersHistoryAsync(int month, int year);

        Task<BrokerAccountMonthTransfersHistoryDto> GetMonthTransfersHistoryByBrokerAccountAsync(Guid brokerAccountId, int month, int year);

        Task<BrokerAccountYearTransfersHistoryDto> GetYearTransfersHistoryAsync(int year);

        Task<BrokerAccountYearTransfersHistoryDto> GetYearTransfersHistoryByBrokerAccountAsync(Guid brokerAccountId, int year);

        Task<BrokerAccountTransfersAvailableDatesDto> GetTransfersAvailableDatesAsync(Guid? brokerAccountId);
    }
}

