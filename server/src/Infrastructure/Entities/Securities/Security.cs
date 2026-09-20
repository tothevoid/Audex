using System;
using Audex.Infrastructure.Entities.Brokers;
using System.Collections.Generic;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Entities.Securities
{
    public class Security: BaseEntity
    {
        public string Name { get; set; }

        public string Ticker { get; set; }

        public string Isin { get; set; }

        public SecurityType Type { get; set; }

        public Guid TypeId { get; set; }

        public decimal ActualPrice { get; set; }

        public DateTime? PriceFetchedAt { get; set; }

        public string IconKey { get; set; }

        public Currency Currency { get; set; }

        public Guid CurrencyId { get; set; }

        public ICollection<BrokerAccountSecurity> BrokerAccountSecurities { get; set; }

        public ICollection<Dividend> Dividends { get; set; }

        public ICollection<SecurityTransaction> SecurityTransactions { get; set; }
    }
}
