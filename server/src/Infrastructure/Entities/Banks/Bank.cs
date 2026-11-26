using Audex.Infrastructure.Entities.Brokers;
using Audex.Shared.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Entities.Deposits;

namespace Audex.Infrastructure.Entities.Banks
{
    public class Bank : BaseEntity
    {
        public string Name { get; set; }

        public bool Active { get; set; } = true;

        public string IconKey { get; set; }

        public ICollection<BrokerAccount> BrokerAccounts { get; set; }

        public ICollection<Account> Accounts { get; set; }

        public ICollection<Deposit> Deposits { get; set; }
    }
}
