using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.DTO.Securities;
using Audex.Application.Enums.Brokers;
using Audex.Application.Interfaces.Brokers.Statements;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Services.Brokers.Statements;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Tests.Shared.Fixtures;
using Audex.Tests.Shared.Mock;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class BrokerStatementDiffEngineTests : TestBase
    {
        public BrokerStatementDiffEngineTests(ServiceProviderFixture fixture) : base(fixture)
        {
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Classify_FieldDiscrepancy_When_Commissions_Differ()
        {
            // Arrange
            var (account, security) = await SetupTestEnvironmentAsync(
                isin: "RU000A0JRKT8",
                ticker: "PHOR",
                name: "ФосАгро ао");

            var transactionDate = new DateTime(2025, 12, 8, 16, 46, 27, DateTimeKind.Utc);
            var existingTransaction = await AddTransactionAsync(
                brokerAccountId: account.Id,
                securityId: security.Id,
                date: transactionDate,
                quantity: 1,
                price: 6402m,
                isSell: false,
                brokerCommission: 0m,
                stockExchangeCommission: 0m,
                tax: 0m);

            var parsedTransaction = new ParsedStatementTransactionDto
            {
                Isin = "RU000A0JRKT8",
                SecurityName = "ФосАгро ао",
                Ticker = "PHOR",
                TradeDateTime = transactionDate,
                IsSell = false,
                Quantity = 1,
                Price = 6402m,
                BrokerCommission = 2.56m,
                StockExchangeCommission = 0.42m,
                Tax = 0m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { parsedTransaction });
            });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.DiscrepancyCount);
            Assert.Equal(0, result.NewCount);

            var diffItem = result.DiffItems.First();
            Assert.Equal(StatementDiffType.FieldDiscrepancy, diffItem.DiffType);
            Assert.Equal(existingTransaction.Id, diffItem.DatabaseTransaction!.Id);
            Assert.Contains(StatementDiscrepancyField.BrokerCommission, diffItem.DiscrepancyFields);
            Assert.Contains(StatementDiscrepancyField.StockExchangeCommission, diffItem.DiscrepancyFields);
            Assert.Equal(2.56m, diffItem.StatementTransaction!.BrokerCommission);
            Assert.Equal(0m, diffItem.DatabaseTransaction!.BrokerCommission);
            Assert.True(diffItem.SelectedForApply);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Set_Warning_When_Security_Not_Found_On_Moex()
        {
            // Arrange
            var (account, _) = await SetupTestEnvironmentAsync();

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var stockConnector = (MockStockConnector)scopeProvider.GetRequiredService<IStockConnector>();
                stockConnector.FindSecurityInfoHandler = query => Task.FromResult<MarketSecurityInfoDto?>(null);
            });

            var parsedTransaction = new ParsedStatementTransactionDto
            {
                Isin = "RU000UNKNOWN",
                SecurityName = "Неизвестная бумага",
                TradeDateTime = new DateTime(2025, 12, 8, 16, 46, 27, DateTimeKind.Utc),
                IsSell = false,
                Quantity = 5,
                Price = 100m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { parsedTransaction });
            });

            // Assert
            Assert.Equal(1, result.WarningCount);
            var item = result.DiffItems.First();
            Assert.True(item.HasWarning);
            Assert.False(item.SelectedForApply);
            Assert.Equal(StatementSecurityStatus.NotFoundInMarket, item.SecurityResolutionStatus);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Match_Existing_Security_By_Resolved_Ticker_When_Db_Security_Has_No_Isin()
        {
            // Arrange
            var (account, existingSecurityWithoutIsin) = await SetupTestEnvironmentAsync(
                isin: null,
                ticker: "PHOR",
                name: "ФосАгро ао");

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var stockConnector = (MockStockConnector)scopeProvider.GetRequiredService<IStockConnector>();
                stockConnector.FindSecurityInfoHandler = query =>
                {
                    if (query == "RU000A0JRKT8")
                    {
                        return Task.FromResult<MarketSecurityInfoDto?>(new MarketSecurityInfoDto
                        {
                            Ticker = "PHOR",
                            Name = "ФосАгро ао",
                            Isin = "RU000A0JRKT8",
                            LastPrice = 6400m
                        });
                    }
                    return Task.FromResult<MarketSecurityInfoDto?>(null);
                };
            });

            var parsedTransaction = new ParsedStatementTransactionDto
            {
                Isin = "RU000A0JRKT8",
                SecurityName = "ФосАгро ао",
                Ticker = null,
                TradeDateTime = new DateTime(2025, 12, 8, 16, 46, 27, DateTimeKind.Utc),
                IsSell = false,
                Quantity = 1,
                Price = 6402m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { parsedTransaction });
            });

            // Assert
            Assert.NotNull(result);
            var diffItem = result.DiffItems.First();
            Assert.Equal(existingSecurityWithoutIsin.Id, diffItem.StatementTransaction!.SecurityId);
            Assert.Equal(StatementSecurityStatus.ExistingInDatabase, diffItem.SecurityResolutionStatus);
            Assert.Equal("RU000A0JRKT8", diffItem.Isin);
            Assert.Equal("PHOR", diffItem.Ticker);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Classify_UnmatchedDatabaseTransaction_When_Statement_Has_No_Match()
        {
            // Arrange
            var (account, security) = await SetupTestEnvironmentAsync(
                isin: "RU000A0JRKT8",
                ticker: "PHOR",
                name: "ФосАгро ао");

            var existingTransaction = await AddTransactionAsync(
                brokerAccountId: account.Id,
                securityId: security.Id,
                date: new DateTime(2025, 12, 8, 16, 46, 27, DateTimeKind.Utc),
                quantity: 1,
                price: 6402m,
                isSell: false);

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", Array.Empty<ParsedStatementTransactionDto>());
            });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.MissingCount);

            var diffItem = result.DiffItems.First();
            Assert.Equal(StatementDiffType.MissingInStatement, diffItem.DiffType);
            Assert.Equal(existingTransaction.Id, diffItem.DatabaseTransaction!.Id);
            Assert.Null(diffItem.StatementTransaction);
            Assert.False(diffItem.SelectedForApply);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Classify_TimeDiscrepancy_When_Dates_Differ_By_One_Day()
        {
            // Arrange
            var (account, security) = await SetupTestEnvironmentAsync(
                isin: "RU000A0JRKT8",
                ticker: "PHOR",
                name: "ФосАгро ао");

            var dbTransactionDate = new DateTime(2025, 12, 7, 10, 0, 0, DateTimeKind.Utc);
            var existingTransaction = await AddTransactionAsync(
                brokerAccountId: account.Id,
                securityId: security.Id,
                date: dbTransactionDate,
                quantity: 1,
                price: 6402m,
                isSell: false);

            var statementTransactionDate = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);
            var parsedTransaction = new ParsedStatementTransactionDto
            {
                Isin = "RU000A0JRKT8",
                SecurityName = "ФосАгро ао",
                Ticker = "PHOR",
                TradeDateTime = statementTransactionDate,
                IsSell = false,
                Quantity = 1,
                Price = 6402m,
                BrokerCommission = 0m,
                StockExchangeCommission = 0m,
                Tax = 0m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { parsedTransaction });
            });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.DiscrepancyCount);

            var diffItem = result.DiffItems.First();
            Assert.Equal(StatementDiffType.FieldDiscrepancy, diffItem.DiffType);
            Assert.Equal(existingTransaction.Id, diffItem.DatabaseTransaction!.Id);
            Assert.False(diffItem.SelectedForApply);
            Assert.Contains(StatementDiscrepancyField.Date, diffItem.DiscrepancyFields);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Match_Multiple_Executions_Against_Consolidated_Database_Transaction()
        {
            // Arrange
            var (account, security) = await SetupTestEnvironmentAsync(
                isin: "RU000A103X66",
                ticker: "SU26238RMFS4",
                name: "ОФЗ 26238");

            var tradeDate = new DateTime(2025, 12, 10, 14, 30, 0, DateTimeKind.Utc);
            var existingTransaction = await AddTransactionAsync(
                brokerAccountId: account.Id,
                securityId: security.Id,
                date: tradeDate,
                quantity: 3,
                price: 1180.46m,
                isSell: false,
                brokerCommission: 1.00m,
                stockExchangeCommission: 0.50m,
                tax: 0m);

            var fill1 = new ParsedStatementTransactionDto
            {
                OrderNumber = "ORD_01",
                Isin = "RU000A103X66",
                SecurityName = "ОФЗ 26238",
                TradeNumber = "TR_01",
                TradeDateTime = tradeDate.AddMinutes(-5),
                IsSell = false,
                Quantity = 1,
                Price = 1180.40m,
                BrokerCommission = 0.33m,
                StockExchangeCommission = 0.17m,
                Tax = 0m
            };

            var fill2 = new ParsedStatementTransactionDto
            {
                OrderNumber = "ORD_01",
                Isin = "RU000A103X66",
                SecurityName = "ОФЗ 26238",
                TradeNumber = "TR_02",
                TradeDateTime = tradeDate,
                IsSell = false,
                Quantity = 2,
                Price = 1180.49m,
                BrokerCommission = 0.67m,
                StockExchangeCommission = 0.33m,
                Tax = 0m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { fill1, fill2 });
            });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.DiscrepancyCount);
            Assert.Equal(0, result.NewCount);

            var diffItem = result.DiffItems.First();
            Assert.Equal(StatementDiffType.Identical, diffItem.DiffType);
            Assert.Equal(existingTransaction.Id, diffItem.DatabaseTransaction!.Id);
            Assert.True(diffItem.IsConsolidated);
            Assert.Equal(2, diffItem.ConsolidatedCount);
            Assert.False(diffItem.SelectedForApply);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Classify_New_When_No_Matching_Database_Transaction_Exists()
        {
            // Arrange
            var (account, security) = await SetupTestEnvironmentAsync(
                isin: "RU000A0JRKT8",
                ticker: "PHOR",
                name: "ФосАгро ао");

            var parsedTransaction = new ParsedStatementTransactionDto
            {
                Isin = "RU000A0JRKT8",
                SecurityName = "ФосАгро ао",
                Ticker = "PHOR",
                TradeDateTime = new DateTime(2025, 12, 8, 16, 46, 27, DateTimeKind.Utc),
                IsSell = false,
                Quantity = 10,
                Price = 6400m,
                BrokerCommission = 25m,
                StockExchangeCommission = 5m,
                Tax = 0m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { parsedTransaction });
            });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.NewCount);
            Assert.Equal(0, result.DiscrepancyCount);

            var diffItem = result.DiffItems.First();
            Assert.Equal(StatementDiffType.New, diffItem.DiffType);
            Assert.Null(diffItem.DatabaseTransaction);
            Assert.NotNull(diffItem.StatementTransaction);
            Assert.Equal(security.Id, diffItem.StatementTransaction!.SecurityId);
            Assert.True(diffItem.SelectedForApply);
        }

        [Fact]
        public async Task ComputeDiffAsync_Should_Classify_FieldDiscrepancy_For_Consolidated_Fills_When_Price_Differs()
        {
            // Arrange
            var (account, security) = await SetupTestEnvironmentAsync(
                isin: "RU000A103X66",
                ticker: "SU26238RMFS4",
                name: "ОФЗ 26238");

            var tradeDate = new DateTime(2025, 12, 10, 14, 30, 0, DateTimeKind.Utc);
            var existingTransaction = await AddTransactionAsync(
                brokerAccountId: account.Id,
                securityId: security.Id,
                date: tradeDate,
                quantity: 3,
                price: 1180.46m,
                isSell: false,
                brokerCommission: 1.00m,
                stockExchangeCommission: 0.50m,
                tax: 0m);

            var fill1 = new ParsedStatementTransactionDto
            {
                OrderNumber = "ORD_01",
                Isin = "RU000A103X66",
                SecurityName = "ОФЗ 26238",
                TradeNumber = "TR_01",
                TradeDateTime = tradeDate.AddMinutes(-5),
                IsSell = false,
                Quantity = 1,
                Price = 1180.40m,
                BrokerCommission = 0.33m,
                StockExchangeCommission = 0.17m,
                Tax = 0m
            };

            var fill2 = new ParsedStatementTransactionDto
            {
                OrderNumber = "ORD_01",
                Isin = "RU000A103X66",
                SecurityName = "ОФЗ 26238",
                TradeNumber = "TR_02",
                TradeDateTime = tradeDate,
                IsSell = false,
                Quantity = 2,
                Price = 1180.50m,
                BrokerCommission = 0.67m,
                StockExchangeCommission = 0.33m,
                Tax = 0m
            };

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var engine = scopeProvider.GetRequiredService<IBrokerStatementDiffEngine>();
                return await engine.ComputeDiffAsync(account.Id, "vtb", "Europe/Moscow", new[] { fill1, fill2 });
            });

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.DiscrepancyCount);
            Assert.Equal(0, result.NewCount);

            var diffItem = result.DiffItems.First();
            Assert.Equal(StatementDiffType.FieldDiscrepancy, diffItem.DiffType);
            Assert.Equal(existingTransaction.Id, diffItem.DatabaseTransaction!.Id);
            Assert.Contains(StatementDiscrepancyField.Price, diffItem.DiscrepancyFields);
            Assert.Equal(1180.46m, diffItem.DatabaseTransaction!.Price);
            Assert.True(Math.Abs(diffItem.StatementTransaction!.Price - 1180.4666667m) < 0.001m);
            Assert.True(diffItem.IsConsolidated);
            Assert.Equal(2, diffItem.ConsolidatedCount);
            Assert.True(diffItem.SelectedForApply);
        }

        private async Task<(BrokerAccount account, Security security)> SetupTestEnvironmentAsync(
            string? isin = "RU000A0JRKT8",
            string ticker = "PHOR",
            string name = "ФосАгро ао")
        {
            return await ExecuteScopeAsync(async scopeProvider =>
            {
                var unitOfWork = scopeProvider.GetRequiredService<IUnitOfWork>();
                var brokerRepository = unitOfWork.CreateRepository<Broker>();
                var brokerAccountTypeRepository = unitOfWork.CreateRepository<BrokerAccountType>();
                var brokerAccountRepository = unitOfWork.CreateRepository<BrokerAccount>();
                var securityTypeRepository = unitOfWork.CreateRepository<SecurityType>();
                var securityRepository = unitOfWork.CreateRepository<Security>();

                var broker = new Broker
                {
                    Id = Guid.NewGuid(),
                    Name = $"Broker_{Guid.NewGuid():N}"
                };
                await brokerRepository.AddAsync(broker);

                var accountType = new BrokerAccountType
                {
                    Id = Guid.NewGuid(),
                    Name = $"AccType_{Guid.NewGuid():N}"
                };
                await brokerAccountTypeRepository.AddAsync(accountType);

                var account = new BrokerAccount
                {
                    Id = Guid.NewGuid(),
                    Name = $"Account_{Guid.NewGuid():N}",
                    BrokerId = broker.Id,
                    TypeId = accountType.Id,
                    CurrencyId = CurrencyConstants.RUB
                };
                await brokerAccountRepository.AddAsync(account);

                var securityType = new SecurityType
                {
                    Id = Guid.NewGuid(),
                    Name = $"SecType_{Guid.NewGuid():N}"
                };
                await securityTypeRepository.AddAsync(securityType);

                var security = new Security
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Ticker = ticker,
                    Isin = isin,
                    TypeId = securityType.Id,
                    CurrencyId = CurrencyConstants.RUB,
                    ActualPrice = 100m
                };
                await securityRepository.AddAsync(security);

                await unitOfWork.CommitAsync();

                return (account, security);
            });
        }

        private async Task<SecurityTransaction> AddTransactionAsync(
            Guid brokerAccountId,
            Guid securityId,
            DateTime date,
            int quantity,
            decimal price,
            bool isSell = false,
            decimal brokerCommission = 0m,
            decimal stockExchangeCommission = 0m,
            decimal tax = 0m)
        {
            return await ExecuteScopeAsync(async scopeProvider =>
            {
                var unitOfWork = scopeProvider.GetRequiredService<IUnitOfWork>();
                var transactionRepository = unitOfWork.CreateRepository<SecurityTransaction>();

                var transaction = new SecurityTransaction
                {
                    Id = Guid.NewGuid(),
                    BrokerAccountId = brokerAccountId,
                    SecurityId = securityId,
                    Date = date,
                    Quantity = quantity,
                    Price = price,
                    IsSell = isSell,
                    BrokerCommission = brokerCommission,
                    StockExchangeCommission = stockExchangeCommission,
                    Tax = tax
                };
                await transactionRepository.AddAsync(transaction);
                await unitOfWork.CommitAsync();

                return transaction;
            });
        }
    }
}
