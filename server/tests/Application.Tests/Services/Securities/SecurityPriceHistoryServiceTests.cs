using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Tests.Shared.Mock;

namespace Audex.Application.Tests.Services.Securities
{
    public class SecurityPriceHistoryServiceTests : TestBase
    {
        public SecurityPriceHistoryServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestEnsureSecurityPricesLoadedAsync_SavesHistoricalPrices()
        {
            var securityId = await CreateSecurityAsync("SBER", "Сбербанк");
            var startDate = new DateOnly(2026, 4, 1);
            var endDate = new DateOnly(2026, 4, 3);

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var mockConnector = (MockStockConnector)serviceProvider.GetRequiredService<IStockConnector>();
                mockConnector.GetCandlesHandler = (security, fromDate, toDate, interval) =>
                {
                    var candles = new List<SecurityCandleDto>
                    {
                        new SecurityCandleDto
                        {
                            Open = 250m,
                            Close = 255m,
                            High = 256m,
                            Low = 249m,
                            Value = 1000000m,
                            Volume = 4000,
                            Begin = new DateTime(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc),
                            End = new DateTime(2026, 4, 1, 18, 45, 0, DateTimeKind.Utc)
                        },
                        new SecurityCandleDto
                        {
                            Open = 255m,
                            Close = 260m,
                            High = 262m,
                            Low = 254m,
                            Value = 1200000m,
                            Volume = 5000,
                            Begin = new DateTime(2026, 4, 2, 10, 0, 0, DateTimeKind.Utc),
                            End = new DateTime(2026, 4, 2, 18, 45, 0, DateTimeKind.Utc)
                        }
                    };
                    return Task.FromResult<IEnumerable<SecurityCandleDto>>(candles);
                };

                var securityService = serviceProvider.GetRequiredService<ISecurityService>();
                var securityResult = await securityService.GetByIdAsync(securityId);
                Assert.NotNull(securityResult);

                var priceHistoryService = serviceProvider.GetRequiredService<ISecurityPriceHistoryService>();
                await priceHistoryService.EnsureSecurityPricesLoadedAsync(
                    new[] { securityResult },
                    startDate,
                    endDate);

                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var priceHistoryRepository = unitOfWork.CreateRepository<SecurityPriceHistory>();
                var savedPrices = await priceHistoryRepository.GetAllAsync(
                    history => history.SecurityId == securityId);

                var savedList = savedPrices.OrderBy(history => history.Date).ToList();
                Assert.True(savedList.Count >= 2);
                Assert.Equal(255m, savedList.First(priceHistory => priceHistory.Date == startDate).ClosePrice);
                Assert.Equal(260m, savedList.First(priceHistory => priceHistory.Date == startDate.AddDays(1)).ClosePrice);
            });
        }

        [Fact]
        public async Task TestSyncActiveSecuritiesPriceHistoryAsync_SyncsPricesForActiveSecurities()
        {
            var securityId = await CreateSecurityAsync("GAZP", "Газпром");

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var brokerService = serviceProvider.GetRequiredService<IBrokerService>();
                var brokerId = await brokerService.AddAsync(new BrokerDto { Name = "Test Broker" });

                var typeService = serviceProvider.GetRequiredService<IBrokerAccountTypeService>();
                var typeId = await typeService.AddAsync(new BrokerAccountTypeDto { Name = "IIS" });

                var accountService = serviceProvider.GetRequiredService<IAccountService>();
                var cashAccountId = await accountService.AddAsync(new AccountDto
                {
                    Name = "Cash",
                    CurrencyId = CurrencyConstants.RUB,
                    AccountTypeId = AccountTypeConstants.Cash,
                    Balance = 100000m
                });

                var brokerAccountService = serviceProvider.GetRequiredService<IBrokerAccountService>();
                var brokerAccountId = await brokerAccountService.AddAsync(new BrokerAccountDto
                {
                    Name = "Broker Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.RUB
                });

                var transactionService = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                await transactionService.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = brokerAccountId,
                    Quantity = 10,
                    Price = 160m,
                    IsSell = false,
                    Date = new DateTime(2026, 3, 1, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var mockConnector = (MockStockConnector)serviceProvider.GetRequiredService<IStockConnector>();
                mockConnector.GetCandlesHandler = (security, fromDate, toDate, interval) =>
                {
                    return Task.FromResult<IEnumerable<SecurityCandleDto>>(new[]
                    {
                        new SecurityCandleDto
                        {
                            Close = 165m,
                            Begin = new DateTime(2026, 3, 1, 10, 0, 0, DateTimeKind.Utc),
                            End = new DateTime(2026, 3, 1, 18, 45, 0, DateTimeKind.Utc)
                        }
                    });
                };

                var priceHistoryService = serviceProvider.GetRequiredService<ISecurityPriceHistoryService>();
                var syncedCount = await priceHistoryService.SyncActiveSecuritiesPriceHistoryAsync();

                Assert.True(syncedCount >= 1);
            });
        }

        private async Task<Guid> CreateSecurityAsync(string ticker, string name)
        {
            return await ExecuteScopeAsync(async serviceProvider =>
            {
                var typeService = serviceProvider.GetRequiredService<ISecurityTypeService>();
                var typeId = await typeService.AddAsync(new SecurityTypeDto { Name = $"StockType_{ticker}" });

                var securityService = serviceProvider.GetRequiredService<ISecurityService>();
                var result = await securityService.AddAsync(new SecurityDto
                {
                    Name = name,
                    Ticker = ticker,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.RUB,
                    ActualPrice = 200m
                }, null);

                return result.Data!.Id;
            });
        }
    }
}
