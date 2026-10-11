using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Currencies;
using Audex.Application.Interfaces.Currencies;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Currencies
{
    public class CurrencyServiceTests : TestBase
    {
        public CurrencyServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetAll_ReturnsDefaultSeededCurrencies()
        {
            var currencies = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return (await currencyService.GetAllAsync()).ToArray();
            });

            Assert.NotNull(currencies);
            Assert.True(currencies.Length >= 3);
            Assert.Contains(currencies, c => c.Id == CurrencyConstants.USD);
            Assert.Contains(currencies, c => c.Id == CurrencyConstants.RUB);
            Assert.Contains(currencies, c => c.Id == CurrencyConstants.EUR);
        }

        [Fact]
        public async Task TestGetById_WhenExists_ReturnsCurrency()
        {
            var currency = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(CurrencyConstants.USD);
            });

            Assert.NotNull(currency);
            Assert.Equal(CurrencyConstants.USD, currency.Id);
            Assert.Equal("USD", currency.Name);
        }

        [Fact]
        public async Task TestGetById_WhenNotExists_ReturnsNull()
        {
            var currency = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(Guid.NewGuid());
            });

            Assert.Null(currency);
        }

        [Fact]
        public async Task TestAdd_CreatesNewCurrency()
        {
            var currencyName = "GBP";

            var newDto = new CurrencyDto
            {
                Name = currencyName,
                Rate = 1.25m,
                Active = true
            };

            var id = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.AddAsync(newDto);
            });

            Assert.NotEqual(Guid.Empty, id);

            var created = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(id);
            });

            Assert.NotNull(created);
            Assert.Equal(currencyName, created.Name);
            Assert.Equal(1.25m, created.Rate);
        }

        [Fact]
        public async Task TestUpdate_ModifiesCurrency()
        {
            var currencyName = "JPY";
            var currencyRate = 0.007m;

            var newDto = new CurrencyDto
            {
                Name = $"{currencyName}Y",
                Rate = currencyRate + 0.002m,
                Active = true
            };

            var id = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.AddAsync(newDto);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                var currency = await currencyService.GetByIdAsync(id);
                currency.Rate = currencyRate;
                currency.Name = "JPY";
                await currencyService.UpdateAsync(currency);
            });

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(id);
            });

            Assert.NotNull(updated);
            Assert.Equal(currencyName, updated.Name);
            Assert.Equal(currencyRate, updated.Rate);
        }

        [Fact]
        public async Task TestDelete_RemovesCurrency()
        {
            var newDto = new CurrencyDto
            {
                Name = "CAD",
                Rate = 0.75m,
                Active = true
            };

            var id = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.AddAsync(newDto);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                await currencyService.DeleteAsync(id);
            });

            var deleted = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(id);
            });

            Assert.Null(deleted);
        }

        [Fact]
        public async Task Test_SyncRates()
        {
            var newDto = new CurrencyDto
            {
                Name = "CAD",
                Rate = 0m,
                Active = true
            };

            var id = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.AddAsync(newDto);
            });

            var mainCurrency = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(CurrencyConstants.RUB);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                await currencyService.SyncRatesAsync(mainCurrency);
            });

            var syncedCurrency = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(id);
            });

            var mainCurrencyActualRate = await ExecuteScopeAsync(async sp =>
            {
                var currencyService = sp.GetRequiredService<ICurrencyService>();
                return await currencyService.GetByIdAsync(mainCurrency.Id);
            });

            Assert.NotEqual(syncedCurrency.Rate, newDto.Rate);
            Assert.Equal(1, mainCurrencyActualRate.Rate);
        }
    }
}
