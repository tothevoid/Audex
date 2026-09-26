using System;

namespace Audex.WebApi.Models.Brokers
{
    public class BrokerAccountTransferAccountValueModel
    {
        public Guid AccountId { get; set; }

        public string AccountName { get; set; }

        public decimal Deposited { get; set; }

        public decimal Withdrawn { get; set; }
    }
}
