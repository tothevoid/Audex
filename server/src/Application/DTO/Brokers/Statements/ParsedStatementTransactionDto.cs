#nullable enable
using System;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class ParsedStatementTransactionDto
    {
        private string _securityName = string.Empty;
        private string? _isin;
        private string? _ticker;
        private string _currency = string.Empty;
        private string? _orderNumber;
        private string? _tradeNumber;

        public DateTime TradeDateTime { get; set; }

        public string SecurityName
        {
            get => _securityName;
            set => _securityName = value?.Trim() ?? string.Empty;
        }

        public string? Isin
        {
            get => _isin;
            set => _isin = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        public string? Ticker
        {
            get => _ticker;
            set => _ticker = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        public bool IsSell { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }

        public string Currency
        {
            get => _currency;
            set => _currency = value?.Trim() ?? string.Empty;
        }

        public decimal BrokerCommission { get; set; }

        public decimal StockExchangeCommission { get; set; }

        public decimal Tax { get; set; }

        public string? OrderNumber
        {
            get => _orderNumber;
            set => _orderNumber = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        public string? TradeNumber
        {
            get => _tradeNumber;
            set => _tradeNumber = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        public bool IsConsolidated { get; set; }

        public int ConsolidatedCount { get; set; } = 1;

        public ParsedStatementTransactionDto Clone()
        {
            return new ParsedStatementTransactionDto
            {
                TradeDateTime = TradeDateTime,
                SecurityName = SecurityName,
                Isin = Isin,
                Ticker = Ticker,
                IsSell = IsSell,
                Quantity = Quantity,
                Price = Price,
                Currency = Currency,
                BrokerCommission = BrokerCommission,
                StockExchangeCommission = StockExchangeCommission,
                Tax = Tax,
                OrderNumber = OrderNumber,
                TradeNumber = TradeNumber,
                IsConsolidated = IsConsolidated,
                ConsolidatedCount = ConsolidatedCount
            };
        }

        public void MergeWith(ParsedStatementTransactionDto nextTransaction)
        {
            int totalQuantity = Quantity + nextTransaction.Quantity;
            if (totalQuantity > 0)
            {
                decimal totalCost = (Price * Quantity) + (nextTransaction.Price * nextTransaction.Quantity);
                Price = Math.Round(totalCost / totalQuantity, 4);
            }
            Quantity = totalQuantity;

            BrokerCommission += nextTransaction.BrokerCommission;
            StockExchangeCommission += nextTransaction.StockExchangeCommission;
            Tax += nextTransaction.Tax;

            if (nextTransaction.TradeDateTime > TradeDateTime)
            {
                TradeDateTime = nextTransaction.TradeDateTime;
            }

            if (OrderNumber == null && nextTransaction.OrderNumber != null)
            {
                OrderNumber = nextTransaction.OrderNumber;
            }

            if (nextTransaction.TradeNumber != null)
            {
                TradeNumber = TradeNumber == null
                    ? nextTransaction.TradeNumber
                    : $"{TradeNumber}, {nextTransaction.TradeNumber}";
            }

            IsConsolidated = true;
            ConsolidatedCount += nextTransaction.ConsolidatedCount;
        }

        public bool IsSameSecurity(ParsedStatementTransactionDto otherTransaction)
        {
            ArgumentNullException.ThrowIfNull(otherTransaction);

            if (Isin != null && otherTransaction.Isin != null)
            {
                return string.Equals(Isin, otherTransaction.Isin, StringComparison.OrdinalIgnoreCase);
            }

            if (Ticker != null && otherTransaction.Ticker != null)
            {
                return string.Equals(Ticker, otherTransaction.Ticker, StringComparison.OrdinalIgnoreCase);
            }

            return string.Equals(SecurityName, otherTransaction.SecurityName, StringComparison.OrdinalIgnoreCase);
        }
    }
}
