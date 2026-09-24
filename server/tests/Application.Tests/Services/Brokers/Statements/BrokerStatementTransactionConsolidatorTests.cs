using System;
using System.Collections.Generic;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Services.Brokers.Statements;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class BrokerStatementTransactionConsolidatorTests
    {
        [Fact]
        public void ConsolidateByOrderNumber_Should_Merge_Partial_Fills_With_Same_OrderNumber_And_Take_Latest_Date()
        {
            // Arrange
            var date1 = new DateTime(2026, 7, 8, 14, 33, 10);
            var date2 = new DateTime(2026, 7, 8, 14, 33, 52); // later

            var tx1 = new ParsedStatementTransactionDto
            {
                Isin = "RU000A0JNAA8",
                SecurityName = "Полюс",
                IsSell = true,
                Quantity = 4,
                Price = 1380m,
                BrokerCommission = 1.0m,
                StockExchangeCommission = 0.5m,
                TradeDateTime = date1,
                OrderNumber = "ORD-999"
            };

            var tx2 = new ParsedStatementTransactionDto
            {
                Isin = "RU000A0JNAA8",
                SecurityName = "Полюс",
                IsSell = true,
                Quantity = 6,
                Price = 1380m,
                BrokerCommission = 1.5m,
                StockExchangeCommission = 0.75m,
                TradeDateTime = date2,
                OrderNumber = "ORD-999"
            };

            // Act
            var result = BrokerStatementTransactionConsolidator.ConsolidateByOrderNumber(new[] { tx1, tx2 });

            // Assert
            Assert.Single(result);
            var merged = result[0];
            Assert.Equal(10, merged.Quantity);
            Assert.Equal(1380m, merged.Price);
            Assert.Equal(2.5m, merged.BrokerCommission);
            Assert.Equal(1.25m, merged.StockExchangeCommission);
            Assert.Equal(date2, merged.TradeDateTime); // Date from the latest transaction
            Assert.Equal("ORD-999", merged.OrderNumber);
        }

        [Fact]
        public void FindPotentialTimeClusters_Should_Group_Transactions_Within_120_Seconds()
        {
            // Arrange
            var date1 = new DateTime(2026, 7, 8, 10, 0, 10);
            var date2 = new DateTime(2026, 7, 8, 10, 1, 30); // 80s later (< 120s)
            var date3 = new DateTime(2026, 7, 8, 11, 0, 0); // 1 hour later

            var tx1 = new ParsedStatementTransactionDto
            {
                Isin = "RU0009029540",
                SecurityName = "Сбербанк",
                IsSell = false,
                Quantity = 5,
                Price = 280m,
                TradeDateTime = date1
            };

            var tx2 = new ParsedStatementTransactionDto
            {
                Isin = "RU0009029540",
                SecurityName = "Сбербанк",
                IsSell = false,
                Quantity = 5,
                Price = 282m,
                TradeDateTime = date2
            };

            var tx3 = new ParsedStatementTransactionDto
            {
                Isin = "RU0009029540",
                SecurityName = "Сбербанк",
                IsSell = false,
                Quantity = 10,
                Price = 285m,
                TradeDateTime = date3
            };

            // Act
            var clusters = BrokerStatementTransactionConsolidator.FindPotentialTimeClusters(new[] { tx1, tx2, tx3 }, 120);

            // Assert: tx1 and tx2 must form 1 cluster, tx3 must not be clustered
            Assert.Single(clusters);
            var cluster = clusters[0];
            Assert.Equal(2, cluster.Count);
            Assert.Equal(10, cluster.TotalQuantity);
            Assert.Equal(281m, cluster.WeightedPrice);
            Assert.Equal(date2, cluster.LastTradeDateTime);
        }

        [Fact]
        public void Clone_Should_Create_Independent_Copy()
        {
            // Arrange
            var original = new ParsedStatementTransactionDto
            {
                TradeDateTime = new DateTime(2026, 7, 8, 10, 0, 0),
                SecurityName = "Лукойл",
                Isin = "RU0009024277",
                Ticker = "LKOH",
                IsSell = false,
                Quantity = 10,
                Price = 6500m,
                Currency = "RUB",
                BrokerCommission = 15m,
                StockExchangeCommission = 5m,
                Tax = 0m,
                OrderNumber = "ORD-123",
                TradeNumber = "TRD-456",
                IsConsolidated = true,
                ConsolidatedCount = 2
            };

            // Act
            var copy = original.Clone();

            // Assert: values are identical
            Assert.Equal(original.TradeDateTime, copy.TradeDateTime);
            Assert.Equal(original.SecurityName, copy.SecurityName);
            Assert.Equal(original.Isin, copy.Isin);
            Assert.Equal(original.Ticker, copy.Ticker);
            Assert.Equal(original.Quantity, copy.Quantity);
            Assert.Equal(original.Price, copy.Price);
            Assert.Equal(original.Currency, copy.Currency);
            Assert.Equal(original.OrderNumber, copy.OrderNumber);
            Assert.Equal(original.TradeNumber, copy.TradeNumber);
            Assert.Equal(original.IsConsolidated, copy.IsConsolidated);
            Assert.Equal(original.ConsolidatedCount, copy.ConsolidatedCount);

            // Assert: mutating copy does not affect original
            copy.Quantity = 999;
            Assert.Equal(10, original.Quantity);
        }

        [Fact]
        public void MergeWith_Should_Consolidate_Weighted_Price_Commissions_And_Latest_Date()
        {
            // Arrange
            var earlierDate = new DateTime(2026, 7, 8, 10, 0, 0);
            var laterDate = new DateTime(2026, 7, 8, 10, 5, 0);

            var firstTransaction = new ParsedStatementTransactionDto
            {
                TradeDateTime = earlierDate,
                Quantity = 10,
                Price = 100m,
                BrokerCommission = 5m,
                StockExchangeCommission = 2m,
                Tax = 1m,
                OrderNumber = "ORD-001",
                TradeNumber = "TRD-1",
                ConsolidatedCount = 1
            };

            var secondTransaction = new ParsedStatementTransactionDto
            {
                TradeDateTime = laterDate,
                Quantity = 20,
                Price = 130m,
                BrokerCommission = 10m,
                StockExchangeCommission = 4m,
                Tax = 2m,
                OrderNumber = "ORD-001",
                TradeNumber = "TRD-2",
                ConsolidatedCount = 1
            };

            // Act
            firstTransaction.MergeWith(secondTransaction);

            // Assert: (10*100 + 20*130) / 30 = 3600 / 30 = 120
            Assert.Equal(30, firstTransaction.Quantity);
            Assert.Equal(120m, firstTransaction.Price);
            Assert.Equal(15m, firstTransaction.BrokerCommission);
            Assert.Equal(6m, firstTransaction.StockExchangeCommission);
            Assert.Equal(3m, firstTransaction.Tax);
            Assert.Equal(laterDate, firstTransaction.TradeDateTime);
            Assert.Equal("TRD-1, TRD-2", firstTransaction.TradeNumber);
            Assert.True(firstTransaction.IsConsolidated);
            Assert.Equal(2, firstTransaction.ConsolidatedCount);
        }

        [Fact]
        public void IsSameSecurity_Should_Match_By_Isin_First()
        {
            // Arrange
            var tx1 = new ParsedStatementTransactionDto
            {
                Isin = "RU0009029540",
                Ticker = "SBER",
                SecurityName = "Сбербанк ПАО"
            };

            var tx2 = new ParsedStatementTransactionDto
            {
                Isin = "RU0009029540",
                Ticker = "DIFFERENT",
                SecurityName = "Другое имя"
            };

            // Act & Assert
            Assert.True(tx1.IsSameSecurity(tx2));
        }

        [Fact]
        public void IsSameSecurity_Should_Match_By_Ticker_When_Isin_Missing()
        {
            // Arrange
            var tx1 = new ParsedStatementTransactionDto
            {
                Isin = null,
                Ticker = "GAZP",
                SecurityName = "Газпром"
            };

            var tx2 = new ParsedStatementTransactionDto
            {
                Isin = null,
                Ticker = "GAZP",
                SecurityName = "Газпром ПАО"
            };

            // Act & Assert
            Assert.True(tx1.IsSameSecurity(tx2));
        }

        [Fact]
        public void IsSameSecurity_Should_Match_By_Name_When_Isin_And_Ticker_Missing()
        {
            // Arrange
            var tx1 = new ParsedStatementTransactionDto
            {
                Isin = null,
                Ticker = null,
                SecurityName = "Фонд Ликвидность"
            };

            var tx2 = new ParsedStatementTransactionDto
            {
                Isin = null,
                Ticker = null,
                SecurityName = "Фонд Ликвидность"
            };

            // Act & Assert
            Assert.True(tx1.IsSameSecurity(tx2));
        }

        [Fact]
        public void FindPotentialTimeClusters_Should_Create_Multiple_Clusters_On_Same_Day_When_Interval_Exceeds_Threshold()
        {
            // Arrange: 2 trades in the morning, 2 trades in the afternoon on the same day for the same security
            var morningTime1 = new DateTime(2026, 7, 8, 10, 0, 0);
            var morningTime2 = new DateTime(2026, 7, 8, 10, 1, 0);
            var afternoonTime1 = new DateTime(2026, 7, 8, 16, 0, 0);
            var afternoonTime2 = new DateTime(2026, 7, 8, 16, 1, 30);

            var transactions = new[]
            {
                new ParsedStatementTransactionDto
                {
                    Isin = "RU0009029540",
                    SecurityName = "Сбербанк",
                    IsSell = false,
                    Quantity = 5,
                    Price = 280m,
                    TradeDateTime = morningTime1
                },
                new ParsedStatementTransactionDto
                {
                    Isin = "RU0009029540",
                    SecurityName = "Сбербанк",
                    IsSell = false,
                    Quantity = 5,
                    Price = 280m,
                    TradeDateTime = morningTime2
                },
                new ParsedStatementTransactionDto
                {
                    Isin = "RU0009029540",
                    SecurityName = "Сбербанк",
                    IsSell = false,
                    Quantity = 10,
                    Price = 285m,
                    TradeDateTime = afternoonTime1
                },
                new ParsedStatementTransactionDto
                {
                    Isin = "RU0009029540",
                    SecurityName = "Сбербанк",
                    IsSell = false,
                    Quantity = 10,
                    Price = 285m,
                    TradeDateTime = afternoonTime2
                }
            };

            // Act
            var clusters = BrokerStatementTransactionConsolidator.FindPotentialTimeClusters(transactions, 120);

            // Assert: Must form 2 separate clusters
            Assert.Equal(2, clusters.Count);

            var firstCluster = clusters[0];
            Assert.Equal(10, firstCluster.TotalQuantity);
            Assert.Equal(morningTime2, firstCluster.LastTradeDateTime);

            var secondCluster = clusters[1];
            Assert.Equal(20, secondCluster.TotalQuantity);
            Assert.Equal(afternoonTime2, secondCluster.LastTradeDateTime);
        }
    }
}
