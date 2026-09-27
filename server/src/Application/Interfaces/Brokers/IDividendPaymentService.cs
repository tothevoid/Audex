using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Common;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IDividendPaymentService
    {
        Task<PagedResult<DividendPaymentDto>> GetAllAsync(DividendPaymentFilterDto filter);

        Task<decimal> GetSumTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId);

        Task<decimal> GetEarningsAsync();

        Task<decimal> GetEarningsByBrokerAccountAsync(Guid brokerAccountId);

        Task<Guid> AddAsync(DividendPaymentDto dividendPaymentDto);

        Task UpdateAsync(DividendPaymentDto dividendPaymentDto);

        Task DeleteAsync(Guid id);
    }
}
