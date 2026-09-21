using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountSecurityServiceTests : TestBase
    {
        public BrokerAccountSecurityServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var (brokerAccountId, securityId) = await SetupDependencies();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                return await service.AddAsync(new BrokerAccountSecurityDto
                {
                    BrokerAccountId = brokerAccountId,
                    SecurityId = securityId,
                    Quantity = 50,
                    Price = 100m
                });
            });

            Assert.NotEqual(Guid.Empty, addedId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, bas => bas.Id == addedId && bas.Quantity == 50);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (brokerAccountId, securityId) = await SetupDependencies();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                return await service.AddAsync(new BrokerAccountSecurityDto
                {
                    BrokerAccountId = brokerAccountId,
                    SecurityId = securityId,
                    Quantity = 10,
                    Price = 120m
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                await service.UpdateAsync(new BrokerAccountSecurityDto
                {
                    Id = addedId,
                    BrokerAccountId = brokerAccountId,
                    SecurityId = securityId,
                    Quantity = 30,
                    Price = 120m
                });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(bas => bas.Id == addedId);
            Assert.NotNull(updated);
            Assert.Equal(30, updated.Quantity);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (brokerAccountId, securityId) = await SetupDependencies();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                return await service.AddAsync(new BrokerAccountSecurityDto
                {
                    BrokerAccountId = brokerAccountId,
                    SecurityId = securityId,
                    Quantity = 10,
                    Price = 120m
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                await service.DeleteAsync(addedId);
            });

            var allAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSecurityService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(allAfterDelete, bas => bas.Id == addedId);
        }

        private async Task<(Guid brokerAccountId, Guid securityId)> SetupDependencies()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "BAS Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "BAS Account Type" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "BAS Account",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var secTypeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "BAS Security Type" });
            });

            var securityId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                var sec = await service.AddAsync(new SecurityDto
                {
                    Name = "BAS Security",
                    Ticker = "BASS",
                    TypeId = secTypeId,
                    CurrencyId = CurrencyConstants.USD,
                    ActualPrice = 100m
                }, null);
                return sec.Data!.Id;
            });

            return (brokerAccountId, securityId);
        }
    }
}
