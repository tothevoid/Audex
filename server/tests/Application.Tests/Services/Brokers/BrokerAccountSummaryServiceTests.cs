using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountSummaryServiceTests : TestBase
    {
        public BrokerAccountSummaryServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetSummary_And_GetSummaryByBrokerAccount()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            // Add a funds transfer
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 5000m,
                    Income = true,
                    Date = DateTime.UtcNow
                });
            });

            var summary = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSummaryService>();
                return await service.GetSummaryAsync();
            });

            Assert.NotNull(summary);
            Assert.NotNull(summary.TransferStats);
            Assert.True(summary.TransferStats.TotalDeposited >= 5000m);

            var accountSummary = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSummaryService>();
                return await service.GetSummaryByBrokerAccountAsync(brokerAccountId);
            });

            Assert.NotNull(accountSummary);
            Assert.Equal(5000m, accountSummary.TransferStats.TotalDeposited);
        }

        [Fact]
        public async Task TestGetTransfersHistory_MonthAndYear_ReturnsHistory()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            // Add a funds transfer
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 5000m,
                    Income = true,
                    Date = DateTime.UtcNow
                });
            });

            var now = DateTime.UtcNow;

            var monthHistory = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSummaryService>();
                return await service.GetMonthTransfersHistoryByBrokerAccountAsync(brokerAccountId, now.Month, now.Year);
            });

            Assert.NotNull(monthHistory);
            Assert.NotEmpty(monthHistory.Days);
            Assert.Equal(5000m, monthHistory.TotalDeposited);
            Assert.Equal(0m, monthHistory.TotalWithdrawn);
            Assert.Contains(monthHistory.Accounts, account => account.AccountId == accountId && account.Deposited == 5000m);

            var yearHistory = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSummaryService>();
                return await service.GetYearTransfersHistoryByBrokerAccountAsync(brokerAccountId, now.Year);
            });

            Assert.NotNull(yearHistory);
            Assert.NotEmpty(yearHistory.Months);
            Assert.Equal(5000m, yearHistory.TotalDeposited);
            Assert.Equal(0m, yearHistory.TotalWithdrawn);
            Assert.Contains(yearHistory.Accounts, account => account.AccountId == accountId && account.Deposited == 5000m);
            Assert.Contains(yearHistory.Months, month => month.AccountValues.Any(account => account.AccountId == accountId && account.Deposited == 5000m));
        }

        [Fact]
        public async Task TestGetTransfersAvailableDates_ReturnsAvailableYearsAndMonths()
        {
            var (brokerAccountId, accountId) = await SetupDependencies();

            var now = DateTime.UtcNow;

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                await service.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 1500m,
                    Income = true,
                    Date = now
                });
            });

            var availableDates = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountSummaryService>();
                return await service.GetTransfersAvailableDatesAsync(brokerAccountId);
            });

            Assert.NotNull(availableDates);
            Assert.Contains(now.Year, availableDates.AvailableYears);
            Assert.True(availableDates.AvailableMonthsByYear.ContainsKey(now.Year));
            Assert.Contains(now.Month, availableDates.AvailableMonthsByYear[now.Year]);
        }

        private async Task<(Guid brokerAccountId, Guid accountId)> SetupDependencies()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Summary Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Summary Acc Type" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Summary Broker Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD,
                    MainCurrencyAmount = 2000m
                });
            });

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IAccountService>();
                return await service.AddAsync(new AccountDto
                {
                    Active = true,
                    Name = "Summary Linked Card",
                    AccountTypeId = AccountTypeConstants.Cash,
                    CurrencyId = CurrencyConstants.USD,
                    Balance = 10000m,
                    CreatedOn = DateOnly.FromDateTime(DateTime.UtcNow)
                });
            });

            return (brokerAccountId, accountId);
        }
    }
}
