using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Brokers
{
    public class BrokerService : IBrokerService
    {
        private readonly IUnitOfWork _db;

        private readonly IRepository<Broker> _brokerRepo;
        private readonly ApplicationMapper _mapper;
        public BrokerService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _brokerRepo = uow.CreateRepository<Broker>();
        }

        public async Task<IEnumerable<BrokerDto>> GetAllAsync(bool onlyActive = false)
        {
            var brokers = onlyActive
                ? await _brokerRepo.GetAllAsync(broker => broker.Active)
                : await _brokerRepo.GetAllAsync();
            return _mapper.Map(brokers.OrderBy(broker => broker.Name, StringComparer.OrdinalIgnoreCase));
        }

        public async Task<Guid> AddAsync(BrokerDto securityDto)
        {
            var broker = _mapper.Map(securityDto);
            broker.Id = Guid.NewGuid();
            await _brokerRepo.AddAsync(broker);
            await _db.CommitAsync();
            return broker.Id;
        }

        public async Task UpdateAsync(BrokerDto brokersDto)
        {
            var brokers = _mapper.Map(brokersDto);
            _brokerRepo.Update(brokers);
            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            await _brokerRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }
    }
}
