using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerServiceTests : TestBase
    {
        public BrokerServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Interactive Brokers" });
            });

            Assert.NotEqual(Guid.Empty, brokerId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, b => b.Id == brokerId && b.Name == "Interactive Brokers");
        }

        [Fact]
        public async Task TestUpdate()
        {
            var actualName = "Interactive Brokers";

            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Brokers" });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                await service.UpdateAsync(new BrokerDto { Id = brokerId, Name = actualName });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(b => b.Id == brokerId);
            Assert.NotNull(updated);
            Assert.Equal(actualName, updated.Name);
        }

        [Fact]
        public async Task TestDelete()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Interactive Brokers" });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(b => b.Id == brokerId);
            Assert.NotNull(updated);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                await service.DeleteAsync(brokerId);
            });

            var allAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(allAfterDelete, b => b.Id == brokerId);
        }
    }
}
