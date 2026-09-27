using Audex.Application.DTO.Securities;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Securities
{
    public interface IDividendService
    {
        Task<PagedResult<DividendDto>> GetAllAsync(DividendFilterDto filter);

        Task<IEnumerable<DividendDto>> GetAvailableAsync(Guid brokerAccountId);

        Task UpdateAsync(DividendDto securityTypeDto);

        Task<Guid> AddAsync(DividendDto securityDto);

        Task DeleteAsync(Guid id);
    }
}
