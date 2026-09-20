using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Entities.Securities;

namespace Audex.Application.Services.Securities
{
    public class SecurityTypeService: ISecurityTypeService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<SecurityType> _securityTypeRepo;
        private readonly ApplicationMapper _mapper;
        public SecurityTypeService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _securityTypeRepo = uow.CreateRepository<SecurityType>();
        }

        public async Task<IEnumerable<SecurityTypeDto>> GetAllAsync()
        {
            var securityTypes = await _securityTypeRepo.GetAllAsync();
            return _mapper.Map(securityTypes);
        }

        public async Task<SecurityTypeDto> GetByIdAsync(Guid id)
        {
            var securityType = await _securityTypeRepo.GetByIdAsync(id);
            return _mapper.Map(securityType);
        }

        public async Task UpdateAsync(SecurityTypeDto securityTypeDto)
        {
            var securityType = _mapper.Map(securityTypeDto);
            _securityTypeRepo.Update(securityType);
            await _db.CommitAsync();
        }

        public async Task<Guid> AddAsync(SecurityTypeDto securityTypeDto)
        {
            var securityType = _mapper.Map(securityTypeDto);
            securityType.Id = Guid.NewGuid();
            await _securityTypeRepo.AddAsync(securityType);
            await _db.CommitAsync();
            return securityType.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _securityTypeRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }
    }
}
