using Audex.Shared.Entities;

namespace Audex.WebApi.Models.Brokers
{
    public class BrokerAccountTypeModel: BaseEntity
    {
        public string Name { get; set; }

        public bool Active { get; set; } = true;
    }
}
