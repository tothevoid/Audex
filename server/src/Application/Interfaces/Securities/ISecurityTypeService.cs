using Audex.Application.DTO.Securities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Securities
{
    public interface ISecurityTypeService
    {
        Task<IEnumerable<SecurityTypeDto>> GetAllAsync();
        Task<SecurityTypeDto> GetByIdAsync(Guid id);
        Task<Guid> AddAsync(SecurityTypeDto securityType);
        Task UpdateAsync(SecurityTypeDto securityType);
        Task DeleteAsync(Guid id);
    }
}
