#nullable enable
using System;
using System.Collections.Generic;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Services.Brokers.Statements
{
    public class StatementTimeCluster
    {
        private readonly List<ParsedStatementTransactionDto> _transactions = new();
        private decimal _totalCost;

        public StatementTimeCluster(ParsedStatementTransactionDto initialTransaction)
        {
            ArgumentNullException.ThrowIfNull(initialTransaction);

            IsSell = initialTransaction.IsSell;
            SecurityName = initialTransaction.SecurityName;
            Isin = initialTransaction.Isin;
            Ticker = initialTransaction.Ticker;

            Add(initialTransaction);
        }

        public ParsedStatementTransactionDto BaseTransaction => _transactions[0];

        public IReadOnlyList<ParsedStatementTransactionDto> Transactions => _transactions;

        public int Count => _transactions.Count;

        public int TotalQuantity { get; private set; }

        public decimal WeightedPrice { get; private set; }

        public decimal TotalBrokerCommission { get; private set; }

        public decimal TotalStockExchangeCommission { get; private set; }

        public decimal TotalTax { get; private set; }

        public DateTime LastTradeDateTime { get; private set; }

        public bool IsSell { get; }

        public string? Isin { get; }

        public string? Ticker { get; }

        public string SecurityName { get; }

        public void Add(ParsedStatementTransactionDto transaction)
        {
            ArgumentNullException.ThrowIfNull(transaction);

            if (transaction.TradeDateTime > LastTradeDateTime)
            {
                LastTradeDateTime = transaction.TradeDateTime;
            }

            _transactions.Add(transaction);
            TotalQuantity += transaction.Quantity;
            TotalBrokerCommission += transaction.BrokerCommission;
            TotalStockExchangeCommission += transaction.StockExchangeCommission;
            TotalTax += transaction.Tax;
            _totalCost += transaction.Price * transaction.Quantity;
            WeightedPrice = TotalQuantity > 0 ? Math.Round(_totalCost / TotalQuantity, 4) : 0m;
        }

        public bool Contains(ParsedStatementTransactionDto transaction)
        {
            return _transactions.Contains(transaction);
        }
    }
}
