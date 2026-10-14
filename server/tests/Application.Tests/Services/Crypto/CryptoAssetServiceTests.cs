using Audex.Application.DTO.Crypto;
using Audex.Application.Interfaces.Crypto;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Audex.Application.Tests.Services.Crypto
{
    public class CryptoAssetServiceTests : TestBase
    {
        public CryptoAssetServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetByCryptoAccountAsync()
        {
            var (accountId, cryptoId) = await SetupDependenciesAsync();

            var addedId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.AddAsync(new CryptoAssetDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 2.5m
                });
            });

            Assert.NotEqual(Guid.Empty, addedId);

            var items = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.GetByCryptoAccountAsync(accountId);
            });

            Assert.NotNull(items);
            Assert.Contains(items, item => item.Id == addedId && item.Quantity == 2.5m);
        }

        [Fact]
        public async Task TestUpdateAsync()
        {
            var (accountId, cryptoId) = await SetupDependenciesAsync();

            var addedId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.AddAsync(new CryptoAssetDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 1.0m
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                await service.UpdateAsync(new CryptoAssetDto
                {
                    Id = addedId,
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 5.0m
                });
            });

            var itemsAfterUpdate = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.GetByCryptoAccountAsync(accountId);
            });

            var updated = itemsAfterUpdate.FirstOrDefault(item => item.Id == addedId);
            Assert.NotNull(updated);
            Assert.Equal(5.0m, updated.Quantity);
        }

        [Fact]
        public async Task TestDeleteAsync()
        {
            var (accountId, cryptoId) = await SetupDependenciesAsync();

            var addedId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.AddAsync(new CryptoAssetDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 1.0m
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                await service.DeleteAsync(addedId);
            });

            var itemsAfterDelete = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.GetByCryptoAccountAsync(accountId);
            });

            Assert.DoesNotContain(itemsAfterDelete, item => item.Id == addedId);
        }

        [Fact]
        public async Task TestAddDuplicateThrowsExceptionAsync()
        {
            var (accountId, cryptoId) = await SetupDependenciesAsync();

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                await service.AddAsync(new CryptoAssetDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 1.0m
                });
            });

            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await ExecuteScopeAsync(async serviceProvider =>
                {
                    var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                    await service.AddAsync(new CryptoAssetDto
                    {
                        CryptoAccountId = accountId,
                        CryptocurrencyId = cryptoId,
                        Quantity = 2.0m
                    });
                });
            });
        }

        [Fact]
        public async Task TestGetTotalBalanceByCryptoAccountAsync()
        {
            var (accountId, cryptoId) = await SetupDependenciesAsync();

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                await service.AddAsync(new CryptoAssetDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 2.0m
                });
            });

            var balance = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.GetTotalBalanceByCryptoAccountAsync(accountId);
            });

            Assert.Equal(300.0m, balance);
        }

        [Fact]
        public async Task TestGetTotalBalanceAsync()
        {
            var (accountId, cryptoId) = await SetupDependenciesAsync();

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                await service.AddAsync(new CryptoAssetDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 3.0m
                });
            });

            var totalBalance = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAssetService>();
                return await service.GetTotalBalanceAsync();
            });

            Assert.True(totalBalance >= 450.0m);
        }

        private async Task<(Guid accountId, Guid cryptoId)> SetupDependenciesAsync()
        {
            var providerId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoProviderService>();
                var provider = await service.AddAsync(new CryptoProviderDto { Name = "Kraken" });
                return provider.Id;
            });

            var accountId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Kraken Account",
                    CryptoProviderId = providerId
                });
            });

            var crypto = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptocurrencyService>();
                return await service.AddAsync(new CryptocurrencyDto { Name = "Solana", Symbol = "SOL", Price = 150m }, null);
            });

            return (accountId, crypto.Id);
        }
    }
}
