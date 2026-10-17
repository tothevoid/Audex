using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerAccountTaxDeductionService
    {
        Task<IEnumerable<BrokerAccountTaxDeductionDto>> GetAllAsync(Guid? brokerAccountId);
        Task<IEnumerable<BrokerAccountTaxDeductionDto>> GetTillDateAsync(DateOnly date, Guid? brokerAccountId = null);
        Task<decimal> GetSumTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId);
        Task<decimal> GetAmountByBrokerAccountAsync(Guid brokerAccountId);
        Task<Guid> AddAsync(BrokerAccountTaxDeductionDto dto);
        Task UpdateAsync(BrokerAccountTaxDeductionDto dto);
        Task DeleteAsync(Guid id);
    }
}