using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.DTO.Crypto;
using Audex.Infrastructure.Entities.Crypto;

namespace Audex.Application.Tests.Services.Crypto
{
    public class CryptoAccountCryptocurrencyServiceTests : TestBase
    {
        public CryptoAccountCryptocurrencyServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetByCryptoAccount()
        {
            var (accountId, cryptoId) = await SetupDependencies();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.AddAsync(new CryptoAccountCryptocurrencyDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 2.5m
                });
            });

            Assert.NotEqual(Guid.Empty, addedId);

            var items = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.GetByCryptoAccountAsync(accountId);
            });

            Assert.NotNull(items);
            Assert.Contains(items, i => i.Id == addedId && i.Quantity == 2.5m);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (accountId, cryptoId) = await SetupDependencies();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.AddAsync(new CryptoAccountCryptocurrencyDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 1.0m
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                await service.UpdateAsync(new CryptoAccountCryptocurrencyDto
                {
                    Id = addedId,
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 5.0m
                });
            });

            var itemsAfterUpdate = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.GetByCryptoAccountAsync(accountId);
            });

            var updated = itemsAfterUpdate.FirstOrDefault(i => i.Id == addedId);
            Assert.NotNull(updated);
            Assert.Equal(5.0m, updated.Quantity);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (accountId, cryptoId) = await SetupDependencies();

            var addedId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.AddAsync(new CryptoAccountCryptocurrencyDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 1.0m
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                await service.DeleteAsync(addedId);
            });

            var itemsAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.GetByCryptoAccountAsync(accountId);
            });

            Assert.DoesNotContain(itemsAfterDelete, i => i.Id == addedId);
        }

        [Fact]
        public async Task TestAddDuplicateThrowsException()
        {
            var (accountId, cryptoId) = await SetupDependencies();

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                await service.AddAsync(new CryptoAccountCryptocurrencyDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 1.0m
                });
            });

            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                    await service.AddAsync(new CryptoAccountCryptocurrencyDto
                    {
                        CryptoAccountId = accountId,
                        CryptocurrencyId = cryptoId,
                        Quantity = 2.0m
                    });
                });
            });
        }

        [Fact]
        public async Task TestGetTotalBalanceByCryptoAccount()
        {
            var (accountId, cryptoId) = await SetupDependencies();

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                await service.AddAsync(new CryptoAccountCryptocurrencyDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 2.0m
                });
            });

            var balance = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.GetTotalBalanceByCryptoAccountAsync(accountId);
            });

            Assert.Equal(300.0m, balance);
        }

        [Fact]
        public async Task TestGetTotalBalance()
        {
            var (accountId, cryptoId) = await SetupDependencies();

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                await service.AddAsync(new CryptoAccountCryptocurrencyDto
                {
                    CryptoAccountId = accountId,
                    CryptocurrencyId = cryptoId,
                    Quantity = 3.0m
                });
            });

            var totalBalance = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountCryptocurrencyService>();
                return await service.GetTotalBalanceAsync();
            });

            Assert.True(totalBalance >= 450.0m);
        }

        private async Task<(Guid accountId, Guid cryptoId)> SetupDependencies()
        {
            var providerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                var provider = await service.AddAsync(new CryptoProviderDto { Name = "Kraken" });
                return provider.Id;
            });

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Kraken Account",
                    CryptoProviderId = providerId
                });
            });

            var crypto = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptocurrencyService>();
                return await service.AddAsync(new CryptocurrencyDto { Name = "Solana", Symbol = "SOL", Price = 150m }, null);
            });

            return (accountId, crypto.Id);
        }
    }
}
