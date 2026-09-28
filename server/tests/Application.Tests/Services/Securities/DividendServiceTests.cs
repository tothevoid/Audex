using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Shared.Common;

namespace Audex.Application.Tests.Services.Securities
{
    public class DividendServiceTests : TestBase
    {
        public DividendServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var securityId = await SetupSecurity();
            var today = DateOnly.FromDateTime(DateTime.Now);

            var dividendId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.AddAsync(new DividendDto
                {
                    SecurityId = securityId,
                    Amount = 2.5m,
                    DeclarationDate = today.AddMonths(-1),
                    SnapshotDate = today
                });
            });

            Assert.NotEqual(Guid.Empty, dividendId);

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.GetAllAsync(new DividendFilterDto
                {
                    SecurityId = securityId,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            Assert.NotNull(pagedResult);
            Assert.Equal(1, pagedResult.TotalCount);
            Assert.Contains(pagedResult.Items, item => item.Id == dividendId && item.Amount == 2.5m);
        }

        [Fact]
        public async Task TestPagination()
        {
            var securityId = await SetupSecurity();
            var today = DateOnly.FromDateTime(DateTime.Now);

            for (int index = 1; index <= 5; index++)
            {
                await ExecuteScopeAsync(async serviceProvider =>
                {
                    var service = serviceProvider.GetRequiredService<IDividendService>();
                    await service.AddAsync(new DividendDto
                    {
                        SecurityId = securityId,
                        Amount = index * 1.5m,
                        DeclarationDate = today.AddDays(-index),
                        SnapshotDate = today.AddDays(-index)
                    });
                });
            }

            var pageOne = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.GetAllAsync(new DividendFilterDto
                {
                    SecurityId = securityId,
                    PageIndex = 1,
                    RecordsQuantity = 2
                });
            });

            Assert.Equal(2, pageOne.Items.Count());
            Assert.Equal(5, pageOne.TotalCount);

            var pageThree = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.GetAllAsync(new DividendFilterDto
                {
                    SecurityId = securityId,
                    PageIndex = 3,
                    RecordsQuantity = 2
                });
            });

            Assert.Single(pageThree.Items);
            Assert.Equal(5, pageThree.TotalCount);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var securityId = await SetupSecurity();
            var today = DateOnly.FromDateTime(DateTime.Now);

            var dividendId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.AddAsync(new DividendDto
                {
                    SecurityId = securityId,
                    Amount = 1.0m,
                    DeclarationDate = today,
                    SnapshotDate = today
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                await service.UpdateAsync(new DividendDto
                {
                    Id = dividendId,
                    SecurityId = securityId,
                    Amount = 3.0m,
                    DeclarationDate = today,
                    SnapshotDate = today
                });
            });

            var pagedResult = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.GetAllAsync(new DividendFilterDto
                {
                    SecurityId = securityId,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            var updated = pagedResult.Items.FirstOrDefault(item => item.Id == dividendId);
            Assert.NotNull(updated);
            Assert.Equal(3.0m, updated.Amount);
        }

        [Fact]
        public async Task TestDelete()
        {
            var securityId = await SetupSecurity();
            var today = DateOnly.FromDateTime(DateTime.Now);

            var dividendId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.AddAsync(new DividendDto
                {
                    SecurityId = securityId,
                    Amount = 1.0m,
                    DeclarationDate = today,
                    SnapshotDate = today
                });
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                await service.DeleteAsync(dividendId);
            });

            var listAfterDelete = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<IDividendService>();
                return await service.GetAllAsync(new DividendFilterDto
                {
                    SecurityId = securityId,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            Assert.DoesNotContain(listAfterDelete.Items, item => item.Id == dividendId);
        }

        private async Task<Guid> SetupSecurity()
        {
            var securityTypeId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Dividend Stock Type" });
            });

            return await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ISecurityService>();
                var securityResult = await service.AddAsync(new SecurityDto
                {
                    Name = "Dividend Payer Inc",
                    Ticker = "DIV",
                    TypeId = securityTypeId,
                    CurrencyId = CurrencyConstants.USD,
                    ActualPrice = 100m
                }, null);
                return securityResult.Data!.Id;
            });
        }
    }
}
