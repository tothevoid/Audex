using Audex.Application.DTO.Brokers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Brokers
{
    public interface IBrokerService
    {
        Task<IEnumerable<BrokerDto>> GetAllAsync(bool onlyActive = false);
        Task<Guid> AddAsync(BrokerDto security);
        Task UpdateAsync(BrokerDto security);
        Task DeleteAsync(Guid id);
    }
}
