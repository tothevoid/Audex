using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountTypeServiceTests : TestBase
    {
        public BrokerAccountTypeServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "IIS (Tax Free)" });
            });

            Assert.NotEqual(Guid.Empty, typeId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, t => t.Id == typeId && t.Name == "IIS (Tax Free)");
        }

        [Fact]
        public async Task TestUpdate()
        {
            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Brokerage Initial" });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                await service.UpdateAsync(new BrokerAccountTypeDto { Id = typeId, Name = "Brokerage Updated" });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(t => t.Id == typeId);
            Assert.NotNull(updated);
            Assert.Equal("Brokerage Updated", updated.Name);
        }

        [Fact]
        public async Task TestDelete()
        {
            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Brokerage Initial" });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                await service.DeleteAsync(typeId);
            });

            var allAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(allAfterDelete, t => t.Id == typeId);
        }
    }
}
