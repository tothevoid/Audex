using Audex.Application.DTO.Brokers;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerAccountFundsTransferService
    {
        Task<PagedResult<BrokerAccountFundsTransferDto>> GetAllAsync(BrokerAccountFundsTransferFilterDto filter = null);
        Task<(decimal deposited, decimal withdrawn)> GetSumTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId);
        Task<BrokerAccountFundsTransferDto> AddAsync(BrokerAccountFundsTransferDto transfer);
        Task UpdateAsync(BrokerAccountFundsTransferDto transfer);
        Task DeleteAsync(Guid id);
    }
}

