using Audex.Application.DTO.Crypto;
using Audex.Application.Interfaces.Crypto;
using Microsoft.Extensions.DependencyInjection;
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

            var stats = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAccountStatsService>();
                return await service.GetStatsAsync();
            });

            Assert.NotNull(stats);
            Assert.NotEmpty(stats.CryptoDistribution);
            Assert.NotEmpty(stats.AccountsDistribution);
            Assert.Contains(stats.CryptoDistribution, distribution => distribution.Amount >= 300.0m && distribution.Name.Contains("SOL") && distribution.ConvertedAmount > 0);
            Assert.Contains(stats.AccountsDistribution, distribution => distribution.Name == "Main Account" && distribution.ConvertedAmount > 0);
        }

        [Fact]
        public async Task TestGetStatsByCryptoAccountAsync()
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

            var stats = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAccountStatsService>();
                return await service.GetStatsByCryptoAccountAsync(accountId);
            });

            Assert.NotNull(stats);
            Assert.NotEmpty(stats.CryptoDistribution);
            Assert.Empty(stats.AccountsDistribution);
            Assert.Contains(stats.CryptoDistribution, distribution => distribution.Amount >= 300.0m && distribution.Name.Contains("SOL"));
        }

        private async Task<(Guid accountId, Guid cryptoId)> SetupDependenciesAsync()
        {
            var providerId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoProviderService>();
                var provider = await service.AddAsync(new CryptoProviderDto { Name = "Main" });
                return provider.Id;
            });

            var accountId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICryptoAccountService>();
                return await service.AddAsync(new CryptoAccountDto
                {
                    Name = "Main Account",
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
