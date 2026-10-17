using System;
using Audex.Application.DTO.Brokers;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.Securities
{
    public class SecurityTransactionDto: BaseEntity
    {
        public SecurityDto Security { get; set; }

        public Guid SecurityId { get; set; }

        public BrokerAccountDto BrokerAccount { get; set; }

        public Guid BrokerAccountId { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }

        public DateTime Date { get; set; }

        public decimal BrokerCommission { get; set; }

        public decimal StockExchangeCommission { get; set; }

        public decimal Tax { get; set; }

        public bool IsSell { get; set; }

        public decimal TotalCommissionsAndTax => BrokerCommission + StockExchangeCommission + Tax;

        public decimal NetTotalPrice => IsSell
            ? Quantity * Price - TotalCommissionsAndTax
            : Quantity * Price + TotalCommissionsAndTax;

        public decimal GetTotalPrice => NetTotalPrice;
    }
}
