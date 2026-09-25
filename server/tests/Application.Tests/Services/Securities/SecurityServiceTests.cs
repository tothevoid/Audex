using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Tests.Shared.Mock;

namespace Audex.Application.Tests.Services.Securities
{
    [Trait("Category", "S3")]
    public class SecurityServiceTests : TestBase
    {
        public SecurityServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var typeId = await CreateSecurityType("Equity");

            var dto = new SecurityDto
            {
                Name = "Apple Inc.",
                Ticker = "AAPL",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 220m
            };

            var added = await AddSecurityAsync(dto);

            Assert.NotNull(added);
            Assert.NotEqual(Guid.Empty, added.Id);
            Assert.Equal("AAPL", added.Ticker);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, s => s.Id == added.Id && s.Ticker == "AAPL");
        }

        [Fact]
        public async Task TestUpdate()
        {
            var typeId = await CreateSecurityType("ETF");

            var dto = new SecurityDto
            {
                Name = "S&P 500 ETF",
                Ticker = "VOO",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 450m
            };

            var added = await AddSecurityAsync(dto);

            added.ActualPrice = 480m;
            var updated = await UpdateSecurityAsync(added);

            Assert.NotNull(updated);
            Assert.Equal(480m, updated.ActualPrice);
        }

        [Fact]
        public async Task TestDelete()
        {
            var typeId = await CreateSecurityType("ETF");

            var dto = new SecurityDto
            {
                Name = "S&P 500 ETF",
                Ticker = "VOO",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 450m
            };

            var added = await AddSecurityAsync(dto);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                await service.DeleteAsync(added.Id);
            });

            var allAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(allAfterDelete, s => s.Id == added.Id);
        }

        [Fact]
        public async Task TestFindByTickerAndFindByTickers()
        {
            var typeId = await CreateSecurityType("Equity");

            var dto = new SecurityDto
            {
                Name = "Microsoft Corp.",
                Ticker = "MSFT",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 400m
            };

            await AddSecurityAsync(dto);

            var found = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.FindByTickerAsync("msft");
            });

            Assert.NotNull(found);
            Assert.Equal("MSFT", found.Ticker);

            var foundList = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.FindByTickersAsync(["MSFT", "NONEXISTENT"]);
            });

            Assert.Single(foundList);
            Assert.Equal("MSFT", foundList.First().Ticker);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestDelete_WithIcon()
        {
            var typeId = await CreateSecurityType("EquityIcon");

            var dto = new SecurityDto
            {
                Name = "Security With Icon",
                Ticker = "SWI",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 100m,
                IconKey = "security-sample-icon"
            };

            var added = await AddSecurityAsync(dto);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                await service.DeleteAsync(added.Id);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(all, s => s.Id == added.Id);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_RemoveIcon()
        {
            var typeId = await CreateSecurityType("EquityIcon2");

            var dto = new SecurityDto
            {
                Name = "Security To Remove Icon",
                Ticker = "SRI",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 150m,
                IconKey = "security-initial-icon"
            };

            var added = await AddSecurityAsync(dto);

            added.IconKey = null;
            var updated = await UpdateSecurityAsync(added);

            Assert.NotNull(updated);
            Assert.Null(updated.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestAdd_WithIcon_GeneratesVersionedKey()
        {
            var typeId = await CreateSecurityType("EquityIcon3");
            var formFile = CreateDummyFormFile();

            var dto = new SecurityDto
            {
                Name = "Security Versioned Icon",
                Ticker = "SVI",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 200m
            };

            var added = await AddSecurityAsync(dto, formFile);

            Assert.NotNull(added.IconKey);
            Assert.StartsWith(added.Id.ToString(), added.IconKey);
            Assert.NotEqual(added.Id.ToString(), added.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_ReplaceIcon_GeneratesNewKey()
        {
            var typeId = await CreateSecurityType("EquityIcon4");
            var formFile1 = CreateDummyFormFile();
            var formFile2 = CreateDummyFormFile();

            var dto = new SecurityDto
            {
                Name = "Security Replace Icon",
                Ticker = "SRI2",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.USD,
                ActualPrice = 250m
            };

            var added = await AddSecurityAsync(dto, formFile1);

            var initialKey = added.IconKey;
            Assert.NotNull(initialKey);

            var updated = await UpdateSecurityAsync(added, formFile2);

            Assert.NotNull(updated.IconKey);
            Assert.NotEqual(initialKey, updated.IconKey);
            Assert.StartsWith(added.Id.ToString(), updated.IconKey);

            var iconFile = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.GetIconStreamAsync(updated.IconKey);
            });

            Assert.NotNull(iconFile);
            Assert.NotNull(iconFile.Stream);
            Assert.Equal("image/png", iconFile.ContentType);
        }

        [Fact]
        public async Task TestAddWithIsinAndFindByIsin()
        {
            var typeId = await CreateSecurityType("Equity");
            var isin = "RU0009029540";

            var dto = new SecurityDto
            {
                Name = "Сбербанк",
                Ticker = "SBER",
                Isin = isin,
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB,
                ActualPrice = 280m
            };

            var added = await AddSecurityAsync(dto);

            Assert.NotNull(added);
            Assert.Equal(isin, added.Isin);

            var found = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.FindByIsinAsync(isin);
            });

            Assert.NotNull(found);
            Assert.Equal(added.Id, found.Id);
            Assert.Equal("SBER", found.Ticker);
            Assert.Equal(isin, found.Isin);
        }

        [Fact]
        public async Task TestSearchMarket()
        {
            var info = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.SearchMarketAsync("SBER");
            });

            // If Market API is accessible, verify parsed content
            if (info != null)
            {
                Assert.Equal("SBER", info.Ticker);
                Assert.False(string.IsNullOrEmpty(info.Name));
                Assert.Equal("RU0009029540", info.Isin);
                Assert.Equal(SecurityTypeConstants.Stock, info.TypeId);
                Assert.Equal(CurrencyConstants.RUB, info.CurrencyId);
            }
        }

        [Fact]
        public async Task AddAsync_WhenTickerAlreadyExists_ShouldReturnFailure()
        {
            var typeId = await CreateSecurityType("EquityUnique");
            var dto1 = new SecurityDto
            {
                Name = "Тестовая Бумага 1",
                Ticker = "TEST_DUP",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB,
                ActualPrice = 100m
            };

            await AddSecurityAsync(dto1);

            var dto2 = new SecurityDto
            {
                Name = "Тестовая Бумага 2",
                Ticker = "test_dup",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB,
                ActualPrice = 120m
            };

            var result = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.AddAsync(dto2, null);
            });

            Assert.False(result.IsSuccess);
            Assert.NotNull(result.ErrorMessage);
            Assert.Contains("test_dup", result.ErrorMessage);
        }

        [Fact]
        public async Task UpdateAsync_WhenTickerAlreadyExists_ShouldReturnFailure()
        {
            var typeId = await CreateSecurityType("EquityUniqueUpdate");
            var dto1 = new SecurityDto
            {
                Name = "Первая Бумага",
                Ticker = "TICKER_ONE",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB,
                ActualPrice = 100m
            };

            var dto2 = new SecurityDto
            {
                Name = "Вторая Бумага",
                Ticker = "TICKER_TWO",
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB,
                ActualPrice = 200m
            };

            await AddSecurityAsync(dto1);
            var added2 = await AddSecurityAsync(dto2);

            added2.Ticker = "ticker_one";

            var result = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                return await service.UpdateAsync(added2, null);
            });

            Assert.False(result.IsSuccess);
            Assert.NotNull(result.ErrorMessage);
            Assert.Contains("ticker_one", result.ErrorMessage);
        }

        [Fact]
        public async Task TestAdd_WhenStockConnectorHasQuotation_ShouldSetActualPriceFromConnector()
        {
            var typeId = await CreateSecurityType("PreciousMetal");

            await ExecuteScopeAsync(sp =>
            {
                var stockConnector = (MockStockConnector)sp.GetRequiredService<IStockConnector>();
                stockConnector.GetValuesByTickersHandler = tickers =>
                {
                    var rows = tickers.Select(t => new MarketDataRow
                    {
                        Ticker = t.Ticker,
                        LastValue = 9930.10m,
                        Date = DateTime.UtcNow
                    });
                    return Task.FromResult<IEnumerable<MarketDataRow>>(rows.ToList());
                };
                return Task.CompletedTask;
            });

            var dto = new SecurityDto
            {
                Name = "Золото",
                Ticker = $"GLD_{Guid.NewGuid():N}"[..8],
                TypeId = typeId,
                CurrencyId = CurrencyConstants.RUB,
                ActualPrice = 9386.80m
            };

            var added = await AddSecurityAsync(dto);

            Assert.NotNull(added);
            Assert.Equal(9930.10m, added.ActualPrice);
        }

        private async Task<SecurityDto> AddSecurityAsync(SecurityDto dto, Microsoft.AspNetCore.Http.IFormFile? icon = null)
        {
            return await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                var res = await service.AddAsync(dto, icon);
                Assert.True(res.IsSuccess);
                return res.Data!;
            });
        }

        private async Task<SecurityDto> UpdateSecurityAsync(SecurityDto dto, Microsoft.AspNetCore.Http.IFormFile? icon = null)
        {
            return await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                var res = await service.UpdateAsync(dto, icon);
                Assert.True(res.IsSuccess);
                return res.Data!;
            });
        }

        private static Microsoft.AspNetCore.Http.IFormFile CreateDummyFormFile()
        {
            var content = System.Text.Encoding.UTF8.GetBytes("dummy security image");
            return new Microsoft.AspNetCore.Http.FormFile(new System.IO.MemoryStream(content), 0, content.Length, "icon", "icon.png")
            {
                Headers = new Microsoft.AspNetCore.Http.HeaderDictionary(),
                ContentType = "image/png"
            };
        }

        private async Task<Guid> CreateSecurityType(string name)
        {
            return await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = name });
            });
        }
    }
}
