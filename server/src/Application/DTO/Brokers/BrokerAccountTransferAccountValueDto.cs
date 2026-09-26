using System;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountTransferAccountValueDto
    {
        public Guid AccountId { get; set; }

        public string AccountName { get; set; }

        public decimal Deposited { get; set; }

        public decimal Withdrawn { get; set; }
    }
}
