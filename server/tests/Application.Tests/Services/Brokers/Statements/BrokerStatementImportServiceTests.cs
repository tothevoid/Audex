using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.DTO.Securities;
using Audex.Application.Enums.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Brokers.Statements;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Infrastructure.Constants;
using Audex.Tests.Shared.Fixtures;
using Audex.Tests.Shared.Mock;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class BrokerStatementImportServiceTests : TestBase
    {
        public BrokerStatementImportServiceTests(ServiceProviderFixture fixture) : base(fixture)
        {
        }

        [Fact]
        public async Task GetImporters_ShouldReturnListFromRegistry()
        {
            var importers = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return service.GetImporters();
            });

            Assert.NotEmpty(importers);
            Assert.Contains(importers, importer => importer.Id == "vtb");
        }

        [Fact]
        public async Task AnalyzeAsync_WithEmptyTimeZone_ShouldThrowArgumentException()
        {
            await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                await Assert.ThrowsAsync<ArgumentException>(() =>
                    service.AnalyzeAsync(new MemoryStream(), Guid.NewGuid(), "vtb", "   "));
            });
        }

        [Fact]
        public async Task AnalyzeAsync_WithUnknownImporter_ShouldThrowKeyNotFoundException()
        {
            await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                    service.AnalyzeAsync(new MemoryStream(), Guid.NewGuid(), "unknown_importer", "Europe/Moscow"));
            });
        }


        [Fact]
        public async Task ApplyDiffsAsync_WithNullRequestOrEmptySessionId_ShouldReturnValidationError()
        {
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return await service.ApplyDiffsAsync(new ApplyStatementDiffsRequestDto { SessionId = Guid.Empty });
            });

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task ApplyDiffsAsync_WithExpiredSession_ShouldReturnSessionExpiredFailure()
        {
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return await service.ApplyDiffsAsync(new ApplyStatementDiffsRequestDto
                {
                    SessionId = Guid.NewGuid(),
                    SelectedDiffIds = new List<Guid> { Guid.NewGuid() }
                });
            });

            Assert.False(result.IsSuccess);
            Assert.Equal("SESSION_EXPIRED", result.ErrorCode);
        }

        [Fact]
        public async Task ApplyDiffsAsync_WithEmptySelectedDiffIds_ShouldReturnSuccessWithZeroCounts()
        {
            // Arrange
            var (_, brokerAccountId) = await SetupDependenciesAsync();
            var sessionId = Guid.NewGuid();

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var sessionCache = scopeProvider.GetRequiredService<IBrokerStatementSessionCache>();
                sessionCache.SetSession(new BrokerStatementAnalysisResultDto
                {
                    SessionId = sessionId,
                    BrokerAccountId = brokerAccountId
                });
            });

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return await service.ApplyDiffsAsync(new ApplyStatementDiffsRequestDto
                {
                    SessionId = sessionId,
                    SelectedDiffIds = new List<Guid>()
                });
            });

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(brokerAccountId, result.Data.BrokerAccountId);
            Assert.Equal(0, result.Data.CreatedTransactionsCount);
        }

        [Fact]
        public async Task ApplyDiffsAsync_WithNewTransaction_ShouldCreateTransactionAndRemoveSession()
        {
            // Arrange
            var (securityId, brokerAccountId) = await SetupDependenciesAsync();
            var sessionId = Guid.NewGuid();
            var diffItemId = Guid.NewGuid();

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var sessionCache = scopeProvider.GetRequiredService<IBrokerStatementSessionCache>();
                sessionCache.SetSession(new BrokerStatementAnalysisResultDto
                {
                    SessionId = sessionId,
                    BrokerAccountId = brokerAccountId,
                    DiffItems = new List<BrokerStatementDiffItemDto>
                    {
                        new BrokerStatementDiffItemDto
                        {
                            Id = diffItemId,
                            DiffType = StatementDiffType.New,
                            StatementTransaction = new SecurityTransactionDto
                            {
                                SecurityId = securityId,
                                BrokerAccountId = brokerAccountId,
                                Quantity = 10,
                                Price = 250m,
                                Date = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc),
                                BrokerCommission = 1m,
                                StockExchangeCommission = 0.5m,
                                Tax = 0m,
                                IsSell = false
                            }
                        }
                    }
                });
            });

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return await service.ApplyDiffsAsync(new ApplyStatementDiffsRequestDto
                {
                    SessionId = sessionId,
                    SelectedDiffIds = new List<Guid> { diffItemId }
                });
            });

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.CreatedTransactionsCount);

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var transactionService = scopeProvider.GetRequiredService<ISecurityTransactionService>();
                var transactions = (await transactionService.GetAllAsync(brokerAccountId, 10, 1)).ToList();
                Assert.Single(transactions);
                Assert.Equal(securityId, transactions[0].SecurityId);
                Assert.Equal(250m, transactions[0].Price);
                Assert.Equal(10, transactions[0].Quantity);

                var sessionCache = scopeProvider.GetRequiredService<IBrokerStatementSessionCache>();
                Assert.False(sessionCache.TryGetSession(sessionId, out _));
            });
        }

        [Fact]
        public async Task ApplyDiffsAsync_WithFieldDiscrepancy_ShouldUpdateTransactionAndRemoveSession()
        {
            // Arrange
            var (securityId, brokerAccountId) = await SetupDependenciesAsync();
            var existingTransactionId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var transactionService = scopeProvider.GetRequiredService<ISecurityTransactionService>();
                return await transactionService.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = brokerAccountId,
                    Price = 200m,
                    Quantity = 5,
                    Date = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc),
                    BrokerCommission = 0m,
                    StockExchangeCommission = 0m,
                    Tax = 0m,
                    IsSell = false
                });
            });

            var sessionId = Guid.NewGuid();
            var diffItemId = Guid.NewGuid();

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var sessionCache = scopeProvider.GetRequiredService<IBrokerStatementSessionCache>();
                sessionCache.SetSession(new BrokerStatementAnalysisResultDto
                {
                    SessionId = sessionId,
                    BrokerAccountId = brokerAccountId,
                    DiffItems = new List<BrokerStatementDiffItemDto>
                    {
                        new BrokerStatementDiffItemDto
                        {
                            Id = diffItemId,
                            DiffType = StatementDiffType.FieldDiscrepancy,
                            DatabaseTransaction = new SecurityTransactionDto
                            {
                                Id = existingTransactionId,
                                BrokerAccountId = brokerAccountId,
                                SecurityId = securityId,
                                Price = 200m,
                                Quantity = 5,
                                Date = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc)
                            },
                            StatementTransaction = new SecurityTransactionDto
                            {
                                BrokerAccountId = brokerAccountId,
                                SecurityId = securityId,
                                Quantity = 5,
                                Price = 220m,
                                Date = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc),
                                BrokerCommission = 2m,
                                StockExchangeCommission = 1m,
                                Tax = 0m,
                                IsSell = false
                            }
                        }
                    }
                });
            });

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return await service.ApplyDiffsAsync(new ApplyStatementDiffsRequestDto
                {
                    SessionId = sessionId,
                    SelectedDiffIds = new List<Guid> { diffItemId }
                });
            });

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.UpdatedTransactionsCount);

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var transactionService = scopeProvider.GetRequiredService<ISecurityTransactionService>();
                var transactions = (await transactionService.GetAllAsync(brokerAccountId, 10, 1)).ToList();
                Assert.Single(transactions);
                Assert.Equal(220m, transactions[0].Price);
                Assert.Equal(2m, transactions[0].BrokerCommission);
                Assert.Equal(1m, transactions[0].StockExchangeCommission);

                var sessionCache = scopeProvider.GetRequiredService<IBrokerStatementSessionCache>();
                Assert.False(sessionCache.TryGetSession(sessionId, out _));
            });
        }

        [Fact]
        public async Task ApplyDiffsAsync_WithUnresolvedSecurity_ShouldCreateSecurityFromMarketAndLinkTransaction()
        {
            // Arrange
            var (_, brokerAccountId) = await SetupDependenciesAsync();
            var securityTypeId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = $"StockType_{Guid.NewGuid():N}" });
            });

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var stockConnector = (MockStockConnector)scopeProvider.GetRequiredService<IStockConnector>();
                stockConnector.FindSecurityInfoHandler = query => Task.FromResult<MarketSecurityInfoDto?>(new MarketSecurityInfoDto
                {
                    Ticker = "SBER",
                    Name = "Сбербанк России",
                    Isin = "RU0009029540",
                    LastPrice = 300m,
                    TypeId = securityTypeId,
                    CurrencyId = CurrencyConstants.RUB
                });
            });

            var sessionId = Guid.NewGuid();
            var diffItemId = Guid.NewGuid();

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var sessionCache = scopeProvider.GetRequiredService<IBrokerStatementSessionCache>();
                sessionCache.SetSession(new BrokerStatementAnalysisResultDto
                {
                    SessionId = sessionId,
                    BrokerAccountId = brokerAccountId,
                    DiffItems = new List<BrokerStatementDiffItemDto>
                    {
                        new BrokerStatementDiffItemDto
                        {
                            Id = diffItemId,
                            DiffType = StatementDiffType.New,
                            Ticker = "SBER",
                            Isin = "RU0009029540",
                            SecurityName = "Сбербанк",
                            StatementTransaction = new SecurityTransactionDto
                            {
                                Quantity = 10,
                                Price = 300m,
                                Date = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc),
                                BrokerCommission = 1m,
                                StockExchangeCommission = 0.5m,
                                Tax = 0m,
                                IsSell = false
                            }
                        }
                    }
                });
            });

            // Act
            var result = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerStatementImportService>();
                return await service.ApplyDiffsAsync(new ApplyStatementDiffsRequestDto
                {
                    SessionId = sessionId,
                    SelectedDiffIds = new List<Guid> { diffItemId }
                });
            });

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.CreatedSecuritiesCount);
            Assert.Equal(1, result.Data.CreatedTransactionsCount);

            await ExecuteScopeAsync(async scopeProvider =>
            {
                var securityService = scopeProvider.GetRequiredService<ISecurityService>();
                var createdSecurity = await securityService.FindByTickerAsync("SBER");
                Assert.NotNull(createdSecurity);
                Assert.Equal("RU0009029540", createdSecurity.Isin);

                var transactionService = scopeProvider.GetRequiredService<ISecurityTransactionService>();
                var transactions = (await transactionService.GetAllAsync(brokerAccountId, 10, 1)).ToList();
                Assert.Single(transactions);
                Assert.Equal(createdSecurity.Id, transactions[0].SecurityId);
                Assert.Equal(300m, transactions[0].Price);
            });
        }

        private async Task<(Guid securityId, Guid brokerAccountId)> SetupDependenciesAsync()
        {
            var securityTypeId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = $"StockType_{Guid.NewGuid():N}" });
            });

            var securityId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<ISecurityService>();
                var security = await service.AddAsync(new SecurityDto
                {
                    Name = "Test Security",
                    Ticker = $"TCK_{Guid.NewGuid():N}"[..8],
                    TypeId = securityTypeId,
                    CurrencyId = CurrencyConstants.RUB,
                    ActualPrice = 100m
                }, null);
                return security.Data!.Id;
            });

            var brokerId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = $"Broker_{Guid.NewGuid():N}" });
            });

            var brokerAccountTypeId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = $"AccountType_{Guid.NewGuid():N}" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async scopeProvider =>
            {
                var service = scopeProvider.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = $"BrokerAccount_{Guid.NewGuid():N}",
                    BrokerId = brokerId,
                    TypeId = brokerAccountTypeId,
                    CurrencyId = CurrencyConstants.RUB
                });
            });

            return (securityId, brokerAccountId);
        }
    }
}
