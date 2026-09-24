using System;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Services.Brokers.Statements;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class StatementTimeClusterTests
    {
        [Fact]
        public void Constructor_InitializesClusterPropertiesFromInitialTransaction()
        {
            // Arrange
            var tradeDateTime = new DateTime(2026, 7, 8, 10, 0, 0);
            var transaction = new ParsedStatementTransactionDto
            {
                SecurityName = "Сбербанк",
                Isin = "RU0009029540",
                Ticker = "SBER",
                IsSell = false,
                Quantity = 10,
                Price = 280m,
                BrokerCommission = 5m,
                StockExchangeCommission = 2m,
                Tax = 1m,
                TradeDateTime = tradeDateTime
            };

            // Act
            var cluster = new StatementTimeCluster(transaction);

            // Assert
            Assert.Equal(1, cluster.Count);
            Assert.Same(transaction, cluster.BaseTransaction);
            Assert.Equal(10, cluster.TotalQuantity);
            Assert.Equal(280m, cluster.WeightedPrice);
            Assert.Equal(5m, cluster.TotalBrokerCommission);
            Assert.Equal(2m, cluster.TotalStockExchangeCommission);
            Assert.Equal(1m, cluster.TotalTax);
            Assert.Equal(tradeDateTime, cluster.LastTradeDateTime);
            Assert.False(cluster.IsSell);
            Assert.Equal("RU0009029540", cluster.Isin);
            Assert.Equal("SBER", cluster.Ticker);
            Assert.Equal("Сбербанк", cluster.SecurityName);
            Assert.True(cluster.Contains(transaction));
        }

        [Fact]
        public void Add_SubsequentTransactions_CalculatesWeightedPriceAndAggregatesCommissions()
        {
            // Arrange
            var earlierDateTime = new DateTime(2026, 7, 8, 10, 0, 0);
            var laterDateTime = new DateTime(2026, 7, 8, 10, 1, 0);

            var firstTransaction = new ParsedStatementTransactionDto
            {
                SecurityName = "Лукойл",
                Isin = "RU0009024277",
                Ticker = "LKOH",
                IsSell = true,
                Quantity = 10,
                Price = 6000m,
                BrokerCommission = 10m,
                StockExchangeCommission = 3m,
                Tax = 0m,
                TradeDateTime = earlierDateTime
            };

            var secondTransaction = new ParsedStatementTransactionDto
            {
                SecurityName = "Лукойл",
                Isin = "RU0009024277",
                Ticker = "LKOH",
                IsSell = true,
                Quantity = 30,
                Price = 6400m,
                BrokerCommission = 30m,
                StockExchangeCommission = 9m,
                Tax = 5m,
                TradeDateTime = laterDateTime
            };

            // Act
            var cluster = new StatementTimeCluster(firstTransaction);
            cluster.Add(secondTransaction);

            // Assert: (10 * 6000 + 30 * 6400) / 40 = (60000 + 192000) / 40 = 252000 / 40 = 6300
            Assert.Equal(2, cluster.Count);
            Assert.Same(firstTransaction, cluster.BaseTransaction);
            Assert.Equal(40, cluster.TotalQuantity);
            Assert.Equal(6300m, cluster.WeightedPrice);
            Assert.Equal(40m, cluster.TotalBrokerCommission);
            Assert.Equal(12m, cluster.TotalStockExchangeCommission);
            Assert.Equal(5m, cluster.TotalTax);
            Assert.Equal(laterDateTime, cluster.LastTradeDateTime);
            Assert.True(cluster.IsSell);
            Assert.Equal("RU0009024277", cluster.Isin);
            Assert.Equal("LKOH", cluster.Ticker);
            Assert.True(cluster.Contains(firstTransaction));
            Assert.True(cluster.Contains(secondTransaction));
        }
    }
}
