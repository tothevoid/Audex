using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Services.Brokers;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Brokers
{
    public class BrokerAccountPortfolioHistoryServiceTests : TestBase
    {
        public BrokerAccountPortfolioHistoryServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetHistory_CalculatesReportCorrectly()
        {
            var targetDate = new DateOnly(2026, 5, 1);

            // 1. Setup Dependencies: Broker Account, Card Account, Security, Dividend
            var (brokerAccountId, accountId, securityId) = await SetupDependencies();

            // Deposit 5000 into broker account
            await ExecuteScopeAsync(async sp =>
            {
                var fundsService = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                await fundsService.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 5000m,
                    Income = true,
                    Date = new DateTime(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Withdraw 1000 from broker account
            await ExecuteScopeAsync(async sp =>
            {
                var fundsService = sp.GetRequiredService<IBrokerAccountFundsTransferService>();
                await fundsService.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 1000m,
                    Income = false,
                    Date = new DateTime(2026, 4, 5, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Add tax deduction of 500
            await ExecuteScopeAsync(async sp =>
            {
                var taxService = sp.GetRequiredService<IBrokerAccountTaxDeductionService>();
                await taxService.AddAsync(new BrokerAccountTaxDeductionDto
                {
                    BrokerAccountId = brokerAccountId,
                    Name = "Tax Deduction 2026",
                    Amount = 500m,
                    DateApplied = new DateTime(2026, 4, 10, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Buy 10 AAPL @ 100, no fees => PurchasePriceSum = 1000
            await ExecuteScopeAsync(async sp =>
            {
                var secTxService = sp.GetRequiredService<ISecurityTransactionService>();
                await secTxService.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = brokerAccountId,
                    Quantity = 10,
                    Price = 100m,
                    IsSell = false,
                    Date = new DateTime(2026, 4, 15, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            // Dividend: Amount=2.0m, Quantity=10, Tax=5m => dividend payment = 10 * 2.0 - 5 = 15m
            var divId = await ExecuteScopeAsync(async sp =>
            {
                var divService = sp.GetRequiredService<IDividendService>();
                return await divService.AddAsync(new DividendDto
                {
                    SecurityId = securityId,
                    Amount = 2.0m,
                    DeclarationDate = new DateOnly(2026, 3, 1),
                    SnapshotDate = new DateOnly(2026, 4, 1)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var divPaymentService = sp.GetRequiredService<IDividendPaymentService>();
                await divPaymentService.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = brokerAccountId,
                    DividendId = divId,
                    SecuritiesQuantity = 10,
                    Tax = 5m,
                    ReceivedAt = new DateOnly(2026, 4, 20)
                });
            });

            // Calculations:
            // Deposited = 5000, Withdrawn = 1000
            // TaxDeduction = 500
            // Dividends = 15
            // Purchased = 1000, Sold = 0
            // totalPositive = 5000 + 15 + 0 = 5015
            // totalNegative = 1000 + 1000 = 2000
            // mainCurrencyValue = 5015 - 2000 = 3015
            // Historical price fallback = 0m, so portfolioValue = 3015 + (10 * 0) = 3015
            // ProfitAndLoss = 3015 + 500 - (5000 - 1000) = -485

            var reportByAccount = await ExecuteScopeAsync(async sp =>
            {
                var reportService = sp.GetRequiredService<IBrokerAccountPortfolioHistoryService>();
                return await reportService.GetHistoryAsync(targetDate, brokerAccountId);
            });

            Assert.NotNull(reportByAccount);
            Assert.Equal(targetDate, reportByAccount.Date);
            Assert.Equal(5000m, reportByAccount.TotalDeposited);
            Assert.Equal(1000m, reportByAccount.TotalWithdrawn);
            Assert.Equal(500m, reportByAccount.TotalTaxDeduction);
            Assert.Equal(15m, reportByAccount.TotalDividends);
            Assert.Equal(3015m, reportByAccount.MainCurrencyAmount);
            Assert.Equal(3015m, reportByAccount.PortfolioValue);
            Assert.Equal(-485m, reportByAccount.ProfitAndLoss);

            var reportAll = await ExecuteScopeAsync(async sp =>
            {
                var reportService = sp.GetRequiredService<IBrokerAccountPortfolioHistoryService>();
                return await reportService.GetHistoryAsync(targetDate);
            });

            Assert.NotNull(reportAll);
            Assert.Equal(targetDate, reportAll.Date);
        }

        [Fact]
        public async Task TestGetDateBoundsAsync_ReturnsEarliestTransactionAndMaxDate()
        {
            var (brokerAccountId, accountId, securityId) = await SetupDependencies();

            var initialBounds = await ExecuteScopeAsync(async serviceProvider =>
            {
                var historyService = serviceProvider.GetRequiredService<IBrokerAccountPortfolioHistoryService>();
                return await historyService.GetDateBoundsAsync(brokerAccountId);
            });
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            Assert.Equal(today, initialBounds.MinDate);
            Assert.Equal(today, initialBounds.MaxDate);

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var transactionService = serviceProvider.GetRequiredService<ISecurityTransactionService>();
                await transactionService.AddAsync(new SecurityTransactionDto
                {
                    SecurityId = securityId,
                    BrokerAccountId = brokerAccountId,
                    Quantity = 10,
                    Price = 100m,
                    IsSell = false,
                    Date = new DateTime(2026, 3, 15, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            var updatedBounds = await ExecuteScopeAsync(async serviceProvider =>
            {
                var historyService = serviceProvider.GetRequiredService<IBrokerAccountPortfolioHistoryService>();
                return await historyService.GetDateBoundsAsync(brokerAccountId);
            });

            Assert.Equal(new DateOnly(2026, 3, 15), updatedBounds.MinDate);
            Assert.Equal(today, updatedBounds.MaxDate);
        }

        [Fact]
        public async Task TestGetRangeHistoryAsync_ReturnsPointsForDateRange()
        {
            var (brokerAccountId, accountId, securityId) = await SetupDependencies();

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var fundsService = serviceProvider.GetRequiredService<IBrokerAccountFundsTransferService>();
                await fundsService.AddAsync(new BrokerAccountFundsTransferDto
                {
                    BrokerAccountId = brokerAccountId,
                    AccountId = accountId,
                    Amount = 3000m,
                    Income = true,
                    Date = new DateTime(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc)
                });
            });

            var points = await ExecuteScopeAsync(async serviceProvider =>
            {
                var historyService = serviceProvider.GetRequiredService<IBrokerAccountPortfolioHistoryService>();
                return await historyService.GetRangeHistoryAsync(
                    new DateOnly(2026, 4, 1),
                    new DateOnly(2026, 4, 3),
                    brokerAccountId);
            });

            Assert.NotNull(points);
            var pointList = points.ToList();
            Assert.Equal(3, pointList.Count);
            Assert.Equal(new DateOnly(2026, 4, 1), pointList[0].Date);
            Assert.Equal(3000m, pointList[0].PortfolioValue);
            Assert.Equal(new DateOnly(2026, 4, 3), pointList[2].Date);
            Assert.Equal(3000m, pointList[2].PortfolioValue);
        }

        private async Task<(Guid brokerAccountId, Guid accountId, Guid securityId)> SetupDependencies()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Portfolio Report Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Portfolio Report Type" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Portfolio Report Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IAccountService>();
                return await service.AddAsync(new AccountDto
                {
                    Active = true,
                    Name = "Portfolio Card Acc",
                    AccountTypeId = AccountTypeConstants.Cash,
                    CurrencyId = CurrencyConstants.USD,
                    Balance = 10000m,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            var secTypeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Portfolio Sec Type" });
            });

            var securityId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                var sec = await service.AddAsync(new SecurityDto
                {
                    Name = "Apple Inc.",
                    Ticker = "AAPL",
                    TypeId = secTypeId,
                    CurrencyId = CurrencyConstants.USD,
                    ActualPrice = 150m
                }, null);
                return sec.Data!.Id;
            });

            return (brokerAccountId, accountId, securityId);
        }
    }
}
