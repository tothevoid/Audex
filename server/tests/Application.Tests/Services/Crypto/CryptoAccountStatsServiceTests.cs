using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.DTO.Crypto;
using System;
using System.Threading.Tasks;
using Xunit;

namespace Audex.Application.Tests.Services.Crypto
{
    public class CryptoAccountStatsServiceTests : TestBase
    {
        public CryptoAccountStatsServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetStatsAsync()
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

            var stats = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountStatsService>();
                return await service.GetStatsAsync();
            });

            Assert.NotNull(stats);
            Assert.NotEmpty(stats.CryptoDistribution);
            Assert.NotEmpty(stats.AccountsDistribution);
            Assert.Contains(stats.CryptoDistribution, d => d.Amount >= 300.0m && d.Name.Contains("SOL") && d.ConvertedAmount > 0);
            Assert.Contains(stats.AccountsDistribution, d => d.Name == "Main Account" && d.ConvertedAmount > 0);
        }

        [Fact]
        public async Task TestGetStatsByCryptoAccountAsync()
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

            var stats = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountStatsService>();
                return await service.GetStatsByCryptoAccountAsync(accountId);
            });

            Assert.NotNull(stats);
            Assert.NotEmpty(stats.CryptoDistribution);
            Assert.Empty(stats.AccountsDistribution);
            Assert.Contains(stats.CryptoDistribution, d => d.Amount >= 300.0m && d.Name.Contains("SOL"));
        }

        private async Task<(Guid accountId, Guid cryptoId)> SetupDependencies()
        {
            var providerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                var provider = await service.AddAsync(new CryptoProviderDto { Name = "Main" });
                return provider.Id;
            });

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Main Account",
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
