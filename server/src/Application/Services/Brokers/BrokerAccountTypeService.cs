using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Mappings;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Entities.Brokers;

namespace Audex.Application.Services.Brokers
{
    public class BrokerAccountTypeService : IBrokerAccountTypeService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<BrokerAccountType> _brokerAccountTypeRepo;
        private readonly ApplicationMapper _mapper;
        public BrokerAccountTypeService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _brokerAccountTypeRepo = uow.CreateRepository<BrokerAccountType>();
        }

        public async Task<IEnumerable<BrokerAccountTypeDto>> GetAllAsync(bool onlyActive = false)
        {
            var brokerAccountTypes = onlyActive
                ? await _brokerAccountTypeRepo.GetAllAsync(accountType => accountType.Active)
                : await _brokerAccountTypeRepo.GetAllAsync();
            return _mapper.Map(brokerAccountTypes.OrderBy(accountType => accountType.Name, StringComparer.OrdinalIgnoreCase));
        }

        public async Task<Guid> AddAsync(BrokerAccountTypeDto brokerAccountTypeDto)
        {
            var brokerAccountType = _mapper.Map(brokerAccountTypeDto);
            brokerAccountType.Id = Guid.NewGuid();
            await _brokerAccountTypeRepo.AddAsync(brokerAccountType);
            await _db.CommitAsync();
            return brokerAccountType.Id;
        }

        public async Task UpdateAsync(BrokerAccountTypeDto brokerAccountTypeDto)
        {
            var brokerAccountType = _mapper.Map(brokerAccountTypeDto);
            _brokerAccountTypeRepo.Update(brokerAccountType);
            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            await _brokerAccountTypeRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }
    }
}
