using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerAccountPortfolioHistoryService
    {
        Task<BrokerAccountPortfolioTimelinePointDto> GetHistoryAsync(DateOnly date, Guid? brokerAccountId = null);
        Task<BrokerAccountPortfolioDateBoundsDto> GetDateBoundsAsync(Guid? brokerAccountId = null);
        Task<IEnumerable<BrokerAccountPortfolioTimelinePointDto>> GetRangeHistoryAsync(DateOnly startDate, DateOnly endDate, Guid? brokerAccountId = null);
    }
}
