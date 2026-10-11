using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountTaxDeductionServiceTests : TestBase
    {
        public BrokerAccountTaxDeductionServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var brokerAccountId = await SetupBrokerAccount();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = brokerAccountId,
                    Name = "IIS Tax Deduction 2025",
                    Amount = 52000m,
                    DateApplied = DateTime.UtcNow
                });
            });

            Assert.NotEqual(Guid.Empty, addedId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetAllAsync(brokerAccountId);
            });

            Assert.NotNull(all);
            Assert.Contains(all, d => d.Id == addedId && d.Amount == 52000m);

            var accountAmount = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetAmountByBrokerAccountAsync(brokerAccountId);
            });

            Assert.Equal(52000m, accountAmount);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var brokerAccountId = await SetupBrokerAccount();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = brokerAccountId,
                    Name = "Initial Deduction",
                    Amount = 10000m,
                    DateApplied = DateTime.UtcNow
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                await service.UpdateAsync(new BrokerAccountTaxDeductionDto
                {
                    Id = addedId,
                    BrokerAccountId = brokerAccountId,
                    Name = "Updated Deduction",
                    Amount = 15000m,
                    DateApplied = DateTime.UtcNow
                });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetAllAsync(brokerAccountId);
            });

            var updated = all.FirstOrDefault(d => d.Id == addedId);
            Assert.NotNull(updated);
            Assert.Equal(15000m, updated.Amount);
        }

        [Fact]
        public async Task TestDelete()
        {
            var brokerAccountId = await SetupBrokerAccount();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = brokerAccountId,
                    Name = "Initial Deduction",
                    Amount = 10000m,
                    DateApplied = DateTime.UtcNow
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                await service.DeleteAsync(addedId);
            });

            var listAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetAllAsync(brokerAccountId);
            });

            Assert.DoesNotContain(listAfterDelete, d => d.Id == addedId);
        }

        [Fact]
        public async Task TestGetSumTillSpecificDate()
        {
            var broker1AccId = await SetupBrokerAccount();
            var broker2AccId = await SetupBrokerAccount();
            var targetDate = new DateOnly(2020, 2, 1);

            // Broker 1 deductions
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                // Before date
                await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = broker1AccId,
                    Name = "Broker 1 Deduction 2020",
                    Amount = 13000m,
                    DateApplied = new DateTime(2020, 1, 15, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                // After target date (boundary out)
                await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = broker1AccId,
                    Name = "Broker 1 Deduction 2020 Out",
                    Amount = 26000m,
                    DateApplied = new DateTime(2020, 2, 15, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Broker 2 deductions
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                // Before date
                await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = broker2AccId,
                    Name = "Broker 2 Deduction 2020",
                    Amount = 52000m,
                    DateApplied = new DateTime(2020, 1, 20, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                // After target date (boundary out)
                await service.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = broker2AccId,
                    Name = "Broker 2 Deduction Future",
                    Amount = 10000m,
                    DateApplied = new DateTime(2020, 3, 1, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Verify Broker 1
            var sumB1 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, broker1AccId);
            });
            Assert.Equal(13000m, sumB1);

            // Verify Broker 2
            var sumB2 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, broker2AccId);
            });
            Assert.Equal(52000m, sumB2);

            // Verify All brokers
            var sumAll = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, null);
            });
            Assert.Equal(65000m, sumAll);
        }

        private async Task<Guid> SetupBrokerAccount()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Deduction Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "IIS Type" });
            });

            return await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "IIS Account",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });
        }
    }
}
