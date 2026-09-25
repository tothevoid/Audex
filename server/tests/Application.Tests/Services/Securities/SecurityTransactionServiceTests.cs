using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Securities
{
    public class SecurityTransactionServiceTests : TestBase
    {
        public SecurityTransactionServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var (securityId, brokerAccountId) = await SetupDependencies();

            var dto = new SecurityTransactionDto
            {
                SecurityId = securityId,
                BrokerAccountId = brokerAccountId,
                Quantity = 10,
                Price = 150m,
                Date = DateTime.UtcNow,
                BrokerCommission = 1.5m,
                StockExchangeCommission = 0.5m,
                IsSell = false
            };

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                return await service.AddAsync(dto);
            });

            Assert.NotEqual(Guid.Empty, addedId);

            var all = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto { BrokerAccountId = brokerAccountId, RecordsQuantity = 10, PageIndex = 1 };
                var result = await service.GetAllAsync(filter);
                return result.Items;
            });

            Assert.NotNull(all);
            Assert.Contains(all, st => st.Id == addedId && st.Quantity == 10);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (securityId, brokerAccountId) = await SetupDependencies();

            var dto = new SecurityTransactionDto
            {
                SecurityId = securityId,
                BrokerAccountId = brokerAccountId,
                Quantity = 5,
                Price = 200m,
                Date = DateTime.UtcNow,
                IsSell = false
            };

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                return await service.AddAsync(dto);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.UpdateAsync(new SecurityTransactionDto
                {
                    Id = addedId,
                    SecurityId = securityId,
                    BrokerAccountId = brokerAccountId,
                    Quantity = 20,
                    Price = 210m,
                    Date = DateTime.UtcNow,
                    IsSell = true
                });
            });

            var all = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto { BrokerAccountId = brokerAccountId, RecordsQuantity = 10, PageIndex = 1 };
                var result = await service.GetAllAsync(filter);
                return result.Items;
            });

            var updated = all.FirstOrDefault(st => st.Id == addedId);
            Assert.NotNull(updated);
            Assert.Equal(20, updated.Quantity);
            Assert.True(updated.IsSell);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (securityId, brokerAccountId) = await SetupDependencies();

            var dto = new SecurityTransactionDto
            {
                SecurityId = securityId,
                BrokerAccountId = brokerAccountId,
                Quantity = 5,
                Price = 200m,
                Date = DateTime.UtcNow,
                IsSell = false
            };

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                return await service.AddAsync(dto);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.DeleteAsync(addedId);
            });

            var listAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto { BrokerAccountId = brokerAccountId, RecordsQuantity = 10, PageIndex = 1 };
                var result = await service.GetAllAsync(filter);
                return result.Items;
            });

            Assert.DoesNotContain(listAfterDelete, st => st.Id == addedId);
        }

        [Fact]
        public async Task TestGetSummaryTillSpecificDate()
        {
            var (securityId, broker1AccountId) = await SetupDependencies();
            var (_, broker2AccountId) = await SetupDependencies();
            var targetDate = new DateOnly(2020, 4, 1);

            // Broker 1 transactions
            // Buy 10 @ 100, Tax 2, Broker 1, Exchange 1 => PurchasePriceSum = 1000 + 2 + 1 + 1 = 1004
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = broker1AccountId,
                    Quantity = 10,
                    Price = 100m,
                    Tax = 2m,
                    BrokerCommission = 1m,
                    StockExchangeCommission = 1m,
                    IsSell = false,
                    Date = new DateTime(2020, 3, 10, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Sell 4 @ 120, Tax 1, Broker 1, Exchange 1 => SellPriceSum = 480 - 1 - 1 - 1 = 477
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = broker1AccountId,
                    Quantity = 4,
                    Price = 120m,
                    Tax = 1m,
                    BrokerCommission = 1m,
                    StockExchangeCommission = 1m,
                    IsSell = true,
                    Date = new DateTime(2020, 3, 20, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Buy after target date (should be ignored)
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = broker1AccountId,
                    Quantity = 5,
                    Price = 150m,
                    IsSell = false,
                    Date = new DateTime(2020, 4, 10, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Broker 2 transactions
            // Buy 6 @ 200, Tax 0, Broker 0, Exchange 0 => PurchasePriceSum = 1200
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = broker2AccountId,
                    Quantity = 6,
                    Price = 200m,
                    IsSell = false,
                    Date = new DateTime(2020, 3, 15, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Sell after target date (should be ignored)
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = broker2AccountId,
                    Quantity = 2,
                    Price = 210m,
                    IsSell = true,
                    Date = new DateTime(2020, 4, 15, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Verify Broker 1 Summary
            var summaryB1 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                return await service.GetSummaryTillSpecificDateAsync(targetDate, broker1AccountId);
            });

            Assert.NotNull(summaryB1);
            Assert.True(summaryB1.ContainsKey("MSFT"));
            var msftB1 = summaryB1["MSFT"];
            Assert.Equal(6, msftB1.ActualQuantity); // 10 bought - 4 sold
            Assert.Equal(1004m, msftB1.PurchasePriceSum);
            Assert.Equal(477m, msftB1.SellPriceSum);

            // Verify Broker 2 Summary
            var summaryB2 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                return await service.GetSummaryTillSpecificDateAsync(targetDate, broker2AccountId);
            });

            Assert.NotNull(summaryB2);
            Assert.True(summaryB2.ContainsKey("MSFT"));
            var msftB2 = summaryB2["MSFT"];
            Assert.Equal(6, msftB2.ActualQuantity);
            Assert.Equal(1200m, msftB2.PurchasePriceSum);
            Assert.Equal(0m, msftB2.SellPriceSum);

            // Verify All Brokers Summary (brokerAccountId = null)
            var summaryAll = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTransactionService>();
                return await service.GetSummaryTillSpecificDateAsync(targetDate, null);
            });

            Assert.NotNull(summaryAll);
            Assert.True(summaryAll.ContainsKey("MSFT"));
            var msftAll = summaryAll["MSFT"];
            Assert.Equal(12, msftAll.ActualQuantity); // 6 + 6
            Assert.Equal(2204m, msftAll.PurchasePriceSum); // 1004 + 1200
            Assert.Equal(477m, msftAll.SellPriceSum);
        }

        [Fact]
        public async Task TestGetAllAndPaginationWithFilters()
        {
            var (securityIdFirst, brokerAccountIdFirst) = await SetupDependencies();

            var securityTypeId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "SecTx Stock 2" });
            });

            var securityIdSecond = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityService>();
                var addedSecurity = await service.AddAsync(new SecurityDto
                {
                    Name = "Apple",
                    Ticker = "AAPL",
                    TypeId = securityTypeId,
                    CurrencyId = CurrencyConstants.USD,
                    ActualPrice = 180m
                }, null);
                return addedSecurity.Data!.Id;
            });

            var brokerId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "SecTx Broker 2" });
            });

            var brokerAccountTypeId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Standard Broker Acc 2" });
            });

            var brokerAccountIdSecond = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "SecTx Broker Acc 2",
                    BrokerId = brokerId,
                    TypeId = brokerAccountTypeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var transactionFirstId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                return await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityIdFirst,
                    BrokerAccountId = brokerAccountIdFirst,
                    Quantity = 5,
                    Price = 100m,
                    Date = new DateTime(2026, 1, 10, 12, 0, 0, DateTimeKind.Utc),
                    IsSell = false
                });
            });

            var transactionSecondId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                return await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityIdSecond,
                    BrokerAccountId = brokerAccountIdFirst,
                    Quantity = 3,
                    Price = 150m,
                    Date = new DateTime(2026, 2, 15, 12, 0, 0, DateTimeKind.Utc),
                    IsSell = false
                });
            });

            var transactionThirdId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                return await service.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityIdFirst,
                    BrokerAccountId = brokerAccountIdSecond,
                    Quantity = 10,
                    Price = 120m,
                    Date = new DateTime(2026, 3, 20, 12, 0, 0, DateTimeKind.Utc),
                    IsSell = false
                });
            });

            // 1. Filter by SecurityId
            var securityFilterResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto
                {
                    SecurityId = securityIdFirst,
                    RecordsQuantity = 10,
                    PageIndex = 1
                };
                return await service.GetAllAsync(filter);
            });

            Assert.Contains(securityFilterResult.Items, item => item.Id == transactionFirstId);
            Assert.Contains(securityFilterResult.Items, item => item.Id == transactionThirdId);
            Assert.DoesNotContain(securityFilterResult.Items, item => item.Id == transactionSecondId);
            Assert.Equal(2, securityFilterResult.TotalCount);

            // 2. Filter by BrokerAccountId
            var brokerAccountFilterResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto
                {
                    BrokerAccountId = brokerAccountIdFirst,
                    RecordsQuantity = 10,
                    PageIndex = 1
                };
                return await service.GetAllAsync(filter);
            });

            Assert.Contains(brokerAccountFilterResult.Items, item => item.Id == transactionFirstId);
            Assert.Contains(brokerAccountFilterResult.Items, item => item.Id == transactionSecondId);
            Assert.DoesNotContain(brokerAccountFilterResult.Items, item => item.Id == transactionThirdId);
            Assert.Equal(2, brokerAccountFilterResult.TotalCount);

            // 3. Filter by Date range
            var dateFilterResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto
                {
                    StartDate = new DateOnly(2026, 2, 1),
                    EndDate = new DateOnly(2026, 2, 28),
                    RecordsQuantity = 10,
                    PageIndex = 1
                };
                return await service.GetAllAsync(filter);
            });

            Assert.Single(dateFilterResult.Items);
            Assert.Contains(dateFilterResult.Items, item => item.Id == transactionSecondId);
            Assert.Equal(1, dateFilterResult.TotalCount);

            // 4. Combined filter
            var combinedFilterResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                var filter = new SecurityTransactionsFilterDto
                {
                    SecurityId = securityIdFirst,
                    BrokerAccountId = brokerAccountIdFirst,
                    RecordsQuantity = 10,
                    PageIndex = 1
                };
                return await service.GetAllAsync(filter);
            });

            Assert.Single(combinedFilterResult.Items);
            Assert.Contains(combinedFilterResult.Items, item => item.Id == transactionFirstId);
            Assert.Equal(1, combinedFilterResult.TotalCount);
        }

        private async Task<(Guid securityId, Guid brokerAccountId)> SetupDependencies()
        {
            var securityTypeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "SecTx Stock" });
            });

            var securityId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                var sec = await service.AddAsync(new SecurityDto
                {
                    Name = "Microsoft",
                    Ticker = "MSFT",
                    TypeId = securityTypeId,
                    CurrencyId = CurrencyConstants.USD,
                    ActualPrice = 400m
                }, null);
                return sec.Data!.Id;
            });

            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "SecTx Broker" });
            });

            var brokerAccountTypeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Standard Broker Acc" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "SecTx Broker Acc",
                    BrokerId = brokerId,
                    TypeId = brokerAccountTypeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            return (securityId, brokerAccountId);
        }
    }
}
