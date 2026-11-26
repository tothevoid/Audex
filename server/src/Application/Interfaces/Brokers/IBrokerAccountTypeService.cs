using Audex.Application.DTO.Brokers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerAccountTypeService
    {
        Task<IEnumerable<BrokerAccountTypeDto>> GetAllAsync(bool onlyActive = false);
        Task<Guid> AddAsync(BrokerAccountTypeDto security);
        Task UpdateAsync(BrokerAccountTypeDto security);
        Task DeleteAsync(Guid id);
    }
}
