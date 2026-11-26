using Audex.Infrastructure.Entities.Accounts;
using Audex.Shared.Entities;
using System.Collections.Generic;

namespace Audex.Infrastructure.Entities.Brokers
{
    public class BrokerAccountType: BaseEntity
    {
        public string Name { get; set; }

        public bool Active { get; set; } = true;

        public ICollection<BrokerAccount> BrokerAccounts { get; set; }
    }
}
