using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Tests.Fixtures;

namespace Audex.Application.Tests.Services.Securities
{
    public class SecurityTypeServiceTests : TestBase
    {
        public SecurityTypeServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Stock" });
            });

            Assert.NotEqual(Guid.Empty, typeId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, t => t.Id == typeId && t.Name == "Stock");
        }

        [Fact]
        public async Task TestGetById()
        {
            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Crypto ETF" });
            });

            var result = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.GetByIdAsync(typeId);
            });

            Assert.NotNull(result);
            Assert.Equal(typeId, result.Id);
            Assert.Equal("Crypto ETF", result.Name);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var actualName = "Bond Updated";

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Bond Initial" });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                await service.UpdateAsync(new SecurityTypeDto { Id = typeId, Name = actualName });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(t => t.Id == typeId);
            Assert.NotNull(updated);
            Assert.Equal(actualName, updated.Name);
        }

        [Fact]
        public async Task TestDelete()
        {
            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Bond to delete" });
            });

            var typesInDatabase = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.GetAllAsync();
            });

            Assert.Contains(typesInDatabase, t => t.Id == typeId);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                await service.DeleteAsync(typeId);
            });

            var allAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(allAfterDelete, t => t.Id == typeId);
        }
    }
}
