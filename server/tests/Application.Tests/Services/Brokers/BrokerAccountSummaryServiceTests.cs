using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Tests.Shared.Mock;

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

        [Fact]
        public async Task TestGetDailyStats_WhenYesterdayCandleExists_PrefersCandleClosePrice()
        {
            var ticker = "DAILY_CANDLE_TEST";
            var (brokerAccountId, securityId) = await SetupBrokerAccountWithSecurity(ticker);

            var yesterday = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);
            var olderDate = yesterday.AddDays(-5);

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var priceHistoryRepository = unitOfWork.CreateRepository<SecurityPriceHistory>();

                await priceHistoryRepository.AddAsync(new SecurityPriceHistory
                {
                    Id = Guid.NewGuid(),
                    SecurityId = securityId,
                    Date = olderDate,
                    ClosePrice = 85m
                });

                await priceHistoryRepository.AddAsync(new SecurityPriceHistory
                {
                    Id = Guid.NewGuid(),
                    SecurityId = securityId,
                    Date = yesterday,
                    ClosePrice = 112m
                });

                await unitOfWork.CommitAsync();

                var mockConnector = (MockStockConnector)serviceProvider.GetRequiredService<IStockConnector>();
                mockConnector.GetExtendedValuesByTickersHandler = _ => Task.FromResult<IEnumerable<MarketDataRow>>([
                    new MarketDataRow
                    {
                        Ticker = ticker,
                        LastValue = 120m,
                        Open = 115m,
                        PrevPrice = 110m,
                        Low = 105m,
                        High = 125m,
                        Date = DateTime.UtcNow
                    }
                ]);
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var summaryService = serviceProvider.GetRequiredService<IBrokerAccountSummaryService>();
                var dailyStats = await summaryService.GetDailyStatsByBrokerAccountAsync(brokerAccountId);

                Assert.NotNull(dailyStats);
                var securityStat = Assert.Single(dailyStats.BrokerAccountDailySecurityStats);
                Assert.Equal(112m, securityStat.PreviousDayClosePrice);
                Assert.Equal(115m, securityStat.StartPrice);
                Assert.Equal(120m, securityStat.CurrentPrice);
            });
        }

        [Fact]
        public async Task TestGetDailyStats_WhenYesterdayCandleDoesNotExist_FallsBackToMoexPrevPrice()
        {
            var ticker = "DAILY_FALLBACK_TEST";
            var (brokerAccountId, securityId) = await SetupBrokerAccountWithSecurity(ticker);

            var yesterday = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);
            var olderDate = yesterday.AddDays(-5);

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var priceHistoryRepository = unitOfWork.CreateRepository<SecurityPriceHistory>();

                // Only older candle exists, yesterday is missing
                await priceHistoryRepository.AddAsync(new SecurityPriceHistory
                {
                    Id = Guid.NewGuid(),
                    SecurityId = securityId,
                    Date = olderDate,
                    ClosePrice = 85m
                });

                await unitOfWork.CommitAsync();

                var mockConnector = (MockStockConnector)serviceProvider.GetRequiredService<IStockConnector>();
                mockConnector.GetExtendedValuesByTickersHandler = _ => Task.FromResult<IEnumerable<MarketDataRow>>([
                    new MarketDataRow
                    {
                        Ticker = ticker,
                        LastValue = 120m,
                        Open = 115m,
                        PrevPrice = 110m,
                        Low = 105m,
                        High = 125m,
                        Date = DateTime.UtcNow
                    }
                ]);
            });

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var summaryService = serviceProvider.GetRequiredService<IBrokerAccountSummaryService>();
                var dailyStats = await summaryService.GetDailyStatsByBrokerAccountAsync(brokerAccountId);

                Assert.NotNull(dailyStats);
                var securityStat = Assert.Single(dailyStats.BrokerAccountDailySecurityStats);
                Assert.Equal(110m, securityStat.PreviousDayClosePrice);
                Assert.Equal(115m, securityStat.StartPrice);
                Assert.Equal(120m, securityStat.CurrentPrice);
            });
        }

        private async Task<(Guid brokerAccountId, Guid securityId)> SetupBrokerAccountWithSecurity(string ticker)
        {
            return await ExecuteScopeAsync(async serviceProvider =>
            {
                var brokerService = serviceProvider.GetRequiredService<IBrokerService>();
                var brokerId = await brokerService.AddAsync(new BrokerDto { Name = $"Broker_{ticker}" });

                var typeService = serviceProvider.GetRequiredService<IBrokerAccountTypeService>();
                var typeId = await typeService.AddAsync(new BrokerAccountTypeDto { Name = $"AccountType_{ticker}" });

                var brokerAccountService = serviceProvider.GetRequiredService<IBrokerAccountService>();
                var brokerAccountId = await brokerAccountService.AddAsync(new BrokerAccountDto
                {
                    Name = $"Account_{ticker}",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.RUB,
                    MainCurrencyAmount = 1000m
                });

                var securityTypeService = serviceProvider.GetRequiredService<ISecurityTypeService>();
                var securityTypeId = await securityTypeService.AddAsync(new SecurityTypeDto { Name = $"SecType_{ticker}" });

                var securityService = serviceProvider.GetRequiredService<ISecurityService>();
                var securityResult = await securityService.AddAsync(new SecurityDto
                {
                    Name = $"Name_{ticker}",
                    Ticker = ticker,
                    TypeId = securityTypeId,
                    CurrencyId = CurrencyConstants.RUB,
                    ActualPrice = 120m
                }, null);

                var securityId = securityResult.Data!.Id;

                var brokerAccountSecurityService = serviceProvider.GetRequiredService<IBrokerAccountSecurityService>();
                await brokerAccountSecurityService.AddAsync(new BrokerAccountSecurityDto
                {
                    BrokerAccountId = brokerAccountId,
                    SecurityId = securityId,
                    Quantity = 10,
                    Price = 100m
                });

                return (brokerAccountId, securityId);
            });
        }
    }
}
