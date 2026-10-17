using System;
using Audex.Application.DTO.Securities;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.Brokers
{
    public class DividendPaymentDto : BaseEntity
    {
        public BrokerAccountDto BrokerAccount { get; set; }

        public Guid BrokerAccountId { get; set; }

        public DividendDto Dividend { get; set; }

        public Guid DividendId { get; set; }

        public int SecuritiesQuantity { get; set; }

        public decimal Tax { get; set; }

        public DateOnly ReceivedAt { get; set; }

        public decimal GrossAmount => SecuritiesQuantity * (Dividend?.Amount ?? 0m);

        public decimal NetAmount => GrossAmount - Tax;
    }
}
