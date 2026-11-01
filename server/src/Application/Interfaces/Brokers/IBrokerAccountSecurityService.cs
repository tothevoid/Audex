using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerAccountSecurityService
    {
        Task<IEnumerable<BrokerAccountSecurityDto>> GetAllAsync(bool unionSecurities = false);
        
        Task<IEnumerable<BrokerAccountSecurityDto>> GetByBrokerAccountAsync(Guid brokerAccountId);

        Task PullQuotationsAsync(CancellationToken cancellationToken = default);

        Task PullQuotationsByBrokerAccountAsync(Guid brokerAccountId);
        
        Task<Guid> AddAsync(BrokerAccountSecurityDto security);
        
        Task UpdateAsync(BrokerAccountSecurityDto security);
        
        Task DeleteAsync(Guid id);

        Task<decimal> GetInitialSecuritiesValueAsync(Guid brokerAccountId);

        Task<decimal> GetActualSecuritiesValueAsync(Guid brokerAccountId);

        Task<decimal> GetTotalSoldByBrokerAccountAsync(Guid brokerAccountId);
    }
}
