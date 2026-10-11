using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.DTO.Crypto;
using Audex.Infrastructure.Entities.Crypto;

namespace Audex.Application.Tests.Services.Crypto
{
    public class CryptoAccountServiceTests : TestBase
    {
        public CryptoAccountServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetById()
        {
            var providerId = await CreateProvider("Coinbase");

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Main Crypto Wallet",
                    CryptoProviderId = providerId
                });
            });

            Assert.NotEqual(Guid.Empty, accountId);

            var fetched = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.GetByIdAsync(accountId);
            });

            Assert.NotNull(fetched);
            Assert.Equal(accountId, fetched.Id);
            Assert.Equal("Main Crypto Wallet", fetched.Name);
            Assert.NotNull(fetched.CryptoProvider);
            Assert.Equal("Coinbase", fetched.CryptoProvider.Name);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var providerId = await CreateProvider("OKX");

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Initial Account Name",
                    CryptoProviderId = providerId
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                await service.UpdateAsync(new CryptoAccountDto
                {
                    Id = accountId,
                    Name = "Updated Account Name",
                    CryptoProviderId = providerId
                });
            });

            var fetched = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.GetByIdAsync(accountId);
            });

            Assert.NotNull(fetched);
            Assert.Equal("Updated Account Name", fetched.Name);
        }

        [Fact]
        public async Task TestDelete()
        {
            var providerId = await CreateProvider("OKX");

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Account to Delete",
                    CryptoProviderId = providerId
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                await service.DeleteAsync(accountId);
            });

            var deleted = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.GetByIdAsync(accountId);
            });

            Assert.Null(deleted);
        }

        private async Task<Guid> CreateProvider(string name)
        {
            return await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                var provider = await service.AddAsync(new CryptoProviderDto { Name = name });
                return provider.Id;
            });
        }
    }
}
