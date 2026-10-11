using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.Brokers;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountServiceTests : TestBase
    {
        public BrokerAccountServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var (brokerId, typeId, bankId) = await SetupDependencies();

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Main Brokerage Account",
                    BrokerId = brokerId,
                    BankId = bankId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD,
                    MainCurrencyAmount = 10000m
                });
            });

            Assert.NotEqual(Guid.Empty, accountId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, a => a.Id == accountId && a.Name == "Main Brokerage Account");
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (brokerId, typeId, bankId) = await SetupDependencies();

            var (actualBrokerId, actualTypeId, actualBankId) = await SetupDependencies();

            var actualName = "Updated Broker Acc";

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Initial Broker Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    BankId = bankId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                await service.UpdateAsync(new BrokerAccountDto
                {
                    Id = accountId,
                    Name = actualName,
                    BrokerId = actualBrokerId,
                    TypeId = actualTypeId,
                    BankId = actualBankId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var current = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.GetByIdAsync(accountId);
            });

            Assert.NotNull(current);
            Assert.Equal(actualName, current.Name);
            Assert.Equal(actualBrokerId, current.BrokerId);
            Assert.Equal(actualTypeId, current.TypeId);
            Assert.Equal(actualBankId, current.BankId);
            Assert.Equal(actualTypeId, current.TypeId);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (brokerId, typeId, bankId) = await SetupDependencies();

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Initial Broker Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD,
                    BankId = bankId
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                await service.DeleteAsync(accountId);
            });

            var listAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(listAfterDelete, a => a.Id == accountId);
        }

        private async Task<(Guid brokerId, Guid typeId, Guid bankId)> SetupDependencies()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Test Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Test Broker Acc Type" });
            });

            var bankId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBankService>();
                var bank = await service.AddAsync(new BankDto { Name = "Test Broker Acc Type" }, null);
                return bank.Id;
            });

            return (brokerId, typeId, bankId);
        }
    }
}
