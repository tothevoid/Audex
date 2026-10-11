using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Deposits;
using Audex.Application.Interfaces.Deposits;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Deposits
{
    public class DepositServiceTests : TestBase
    {
        public DepositServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAllActive()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            var futureDate = today.AddYears(1);

            var depositId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.AddAsync(new DepositDto
                {
                    Name = "High Yield Deposit",
                    From = today.AddMonths(-1),
                    To = futureDate,
                    InitialAmount = 10000m,
                    EstimatedEarn = 1000m,
                    Percentage = 10m,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            Assert.NotEqual(Guid.Empty, depositId);

            var activeDeposits = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.GetAllActiveAsync();
            });

            Assert.NotNull(activeDeposits);
            Assert.Contains(activeDeposits, d => d.Id == depositId && d.Name == "High Yield Deposit");
        }

        [Fact]
        public async Task TestGetDepositsRange()
        {
            var from = new DateOnly(2025, 1, 1);
            var to = new DateOnly(2025, 12, 31);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.AddAsync(new DepositDto
                {
                    Name = "Range Test Deposit",
                    From = from,
                    To = to,
                    InitialAmount = 5000m,
                    EstimatedEarn = 500m,
                    Percentage = 10m,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var range = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.GetDepositsRangeAsync();
            });

            Assert.NotNull(range);
            Assert.True(range.From <= from);
            Assert.True(range.To >= to);
        }

        [Fact]
        public async Task TestGetSummary()
        {
            var from = new DateOnly(2025, 1, 1);
            var to = new DateOnly(2025, 12, 31);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.AddAsync(new DepositDto
                {
                    Name = "Summary Test Deposit",
                    From = from,
                    To = to,
                    InitialAmount = 5000m,
                    EstimatedEarn = 500m,
                    Percentage = 10m,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var summary = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                // monthsFrom = 2025*12 + 1, monthsTo = 2025*12 + 12
                int monthsFrom = 2025 * 12 + 1;
                int monthsTo = 2025 * 12 + 12;
                return await service.GetSummaryAsync(monthsFrom, monthsTo, false);
            });

            Assert.NotNull(summary);
            Assert.NotNull(summary.Payments);
            Assert.NotEmpty(summary.Payments);
            Assert.True(summary.TotalEarnings > 0);
            Assert.True(summary.AverageMonthly > 0);
            Assert.NotNull(summary.PeakMonthPeriod);
            Assert.True(summary.PeakMonthValue > 0);
            Assert.Equal(12, summary.MonthsCount);
            Assert.NotNull(summary.DepositTotals);
            Assert.NotEmpty(summary.DepositTotals);
            Assert.All(summary.Payments, p => Assert.True(p.TotalValue > 0));
        }

        [Fact]
        public async Task TestUpdate()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            var depositId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.AddAsync(new DepositDto
                {
                    Name = "Deposit to Update",
                    From = today,
                    To = today.AddMonths(6),
                    InitialAmount = 1000m,
                    EstimatedEarn = 50m,
                    Percentage = 5m,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                await service.UpdateAsync(new DepositDto
                {
                    Id = depositId,
                    Name = "Updated Deposit Name",
                    From = today,
                    To = today.AddMonths(6),
                    InitialAmount = 2000m,
                    EstimatedEarn = 100m,
                    Percentage = 5m,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var activeList = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.GetAllActiveAsync();
            });

            var updated = activeList.FirstOrDefault(d => d.Id == depositId);
            Assert.NotNull(updated);
            Assert.Equal("Updated Deposit Name", updated.Name);
            Assert.Equal(2000m, updated.InitialAmount);
        }

        [Fact]
        public async Task TestDelete()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            var depositId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.AddAsync(new DepositDto
                {
                    Name = "Deposit to Delete",
                    From = today,
                    To = today.AddMonths(6),
                    InitialAmount = 1000m,
                    EstimatedEarn = 50m,
                    Percentage = 5m,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                await service.DeleteAsync(depositId);
            });

            var listAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDepositService>();
                return await service.GetAllActiveAsync();
            });

            Assert.DoesNotContain(listAfterDelete, d => d.Id == depositId);
        }
    }
}
