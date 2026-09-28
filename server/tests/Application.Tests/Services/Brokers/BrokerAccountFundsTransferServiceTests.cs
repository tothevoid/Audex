using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using System.Linq;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountFundsTransferServiceTests : TestBase
    {
        public BrokerAccountFundsTransferServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 1000m,
                    Income = true,
                    Date = DateTime.UtcNow
                });
            });

            Assert.NotNull(added);
            Assert.NotEqual(Guid.Empty, added.Id);

            var all = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetAllAsync(new BrokerAccountFundsTransferFilterDto());
            });

            Assert.NotNull(all);
            Assert.Contains(all.Items, transfer => transfer.Id == added.Id && transfer.Amount == 1000m);

            var accountTransfers = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetAllAsync(new BrokerAccountFundsTransferFilterDto
                {
                    BrokerAccountId = brokerAccountId,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            Assert.NotNull(accountTransfers);
            Assert.Contains(accountTransfers.Items, transfer => transfer.Id == added.Id);
            Assert.Equal(1, accountTransfers.TotalCount);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            var added = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 1000m,
                    Income = true,
                    Date = DateTime.UtcNow
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                await service.UpdateAsync(new BrokerAccountFundsTransferDto
                {
                    Id = added.Id,
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 750m,
                    Income = false,
                    Date = DateTime.UtcNow
                });
            });

            var all = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetAllAsync(new BrokerAccountFundsTransferFilterDto());
            });

            var updated = all.Items.FirstOrDefault(transfer => transfer.Id == added.Id);
            Assert.NotNull(updated);
            Assert.Equal(750m, updated.Amount);
            Assert.False(updated.Income);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            var added = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 500m,
                    Income = true,
                    Date = DateTime.UtcNow
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                await service.DeleteAsync(added.Id);
            });

            var listAfterDelete = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetAllAsync(new BrokerAccountFundsTransferFilterDto());
            });

            Assert.DoesNotContain(listAfterDelete.Items, transfer => transfer.Id == added.Id);
        }

        [Fact]
        public async Task TestGetSumTillSpecificDate()
        {
            var (broker1AccId, account1Id) = await SetupDependencies();
            var (broker2AccId, account2Id) = await SetupDependencies();
            var targetDate = new DateOnly(2020, 1, 15);

            // Broker 1 transfers
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                // Deposit before date
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = broker1AccId,
                    AccountId = account1Id,
                    Amount = 1000m,
                    Income = true,
                    Date = new DateTime(2020, 1, 10, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                // Withdraw before date
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = broker1AccId,
                    AccountId = account1Id,
                    Amount = 300m,
                    Income = false,
                    Date = new DateTime(2020, 1, 12, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                // Deposit after target date (boundary out)
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = broker1AccId,
                    AccountId = account1Id,
                    Amount = 500m,
                    Income = true,
                    Date = new DateTime(2020, 1, 20, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Broker 2 transfers
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                // Deposit before date
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = broker2AccId,
                    AccountId = account2Id,
                    Amount = 2000m,
                    Income = true,
                    Date = new DateTime(2020, 1, 5, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                // Withdraw before date
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = broker2AccId,
                    AccountId = account2Id,
                    Amount = 700m,
                    Income = false,
                    Date = new DateTime(2020, 1, 14, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                // Withdraw after target date (boundary out)
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = broker2AccId,
                    AccountId = account2Id,
                    Amount = 400m,
                    Income = false,
                    Date = new DateTime(2020, 1, 25, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Verify Broker 1 sum till targetDate
            var (depositedB1, withdrawnB1) = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, broker1AccId);
            });
            Assert.Equal(1000m, depositedB1);
            Assert.Equal(300m, withdrawnB1);

            // Verify Broker 2 sum till targetDate
            var (depositedB2, withdrawnB2) = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, broker2AccId);
            });
            Assert.Equal(2000m, depositedB2);
            Assert.Equal(700m, withdrawnB2);

            // Verify All brokers sum till targetDate
            var (depositedAll, withdrawnAll) = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, null);
            });
            Assert.Equal(3000m, depositedAll);
            Assert.Equal(1000m, withdrawnAll);
        }

        [Fact]
        public async Task TestPagination()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            for (int index = 1; index <= 5; index++)
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                    await service.AddAsync(new BrokerAccountFundsTransferDto
                    {
                        BrokerAccountId = brokerAccountId,
                        AccountId = accountId,
                        Amount = index * 100m,
                        Income = true,
                        Date = DateTime.UtcNow.AddDays(-index)
                    });
                });
            }

            var page1 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetAllAsync(new BrokerAccountFundsTransferFilterDto
                {
                    BrokerAccountId = brokerAccountId,
                    PageIndex = 1,
                    RecordsQuantity = 2
                });
            });

            Assert.NotNull(page1);
            Assert.Equal(2, page1.Items.Count());
            Assert.Equal(5, page1.TotalCount);
            Assert.Equal(1, page1.PageIndex);
            Assert.Equal(2, page1.PageSize);

            var page3 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                return await service.GetAllAsync(new BrokerAccountFundsTransferFilterDto
                {
                    BrokerAccountId = brokerAccountId,
                    PageIndex = 3,
                    RecordsQuantity = 2
                });
            });

            Assert.NotNull(page3);
            Assert.Single(page3.Items);
            Assert.Equal(5, page3.TotalCount);
            Assert.Equal(3, page3.PageIndex);
        }

        private async Task<(Guid brokerAccountId, Guid accountId)> SetupDependencies()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Transfer Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Transfer Acc Type" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Transfer Broker Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IAccountService>();
                return await service.AddAsync(new AccountDto
                {
                    Active = true,
                    Name = "Transfer Card Acc",
                    AccountTypeId = AccountTypeConstants.Cash,
                    CurrencyId = CurrencyConstants.USD,
                    Balance = 5000m,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            return (brokerAccountId, accountId);
        }
    }
}
