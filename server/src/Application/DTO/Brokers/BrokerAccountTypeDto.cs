using Audex.Shared.Entities;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountTypeDto: BaseEntity
    {
        public string Name { get; set; }

        public bool Active { get; set; } = true;
    }
}
