using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Brokers
{
    public class DividendPaymentServiceTests : TestBase
    {
        public DividendPaymentServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetEarnings()
        {
            var (brokerAccountId, dividendId) = await SetupDependencies();

            var paymentId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = brokerAccountId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 100,
                    Tax = 5m,
                    ReceivedAt = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            Assert.NotEqual(Guid.Empty, paymentId);

            var totalEarnings = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetEarningsAsync();
            });

            Assert.True(totalEarnings > 0);

            var accountEarnings = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetEarningsByBrokerAccountAsync(brokerAccountId);
            });

            Assert.True(accountEarnings > 0);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (brokerAccountId, dividendId) = await SetupDependencies();

            var paymentId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = brokerAccountId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 50,
                    Tax = 2m,
                    ReceivedAt = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                await service.UpdateAsync(new DividendPaymentDto
                {
                    Id = paymentId,
                    BrokerAccountId = brokerAccountId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 200,
                    Tax = 10m,
                    ReceivedAt = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetAllAsync(brokerAccountId, 1, 10);
            });

            var updated = all.FirstOrDefault(p => p.Id == paymentId);
            Assert.NotNull(updated);
            Assert.Equal(200, updated.SecuritiesQuantity);
            Assert.Equal(10m, updated.Tax);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (brokerAccountId, dividendId) = await SetupDependencies();

            var paymentId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = brokerAccountId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 50,
                    Tax = 2m,
                    ReceivedAt = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                await service.DeleteAsync(paymentId);
            });

            var allAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetAllAsync(brokerAccountId, 1, 10);
            });

            Assert.DoesNotContain(allAfterDelete, p => p.Id == paymentId);
        }

        [Fact]
        public async Task TestGetSumTillSpecificDate()
        {
            var (broker1AccId, dividendId) = await SetupDependencies();
            var (broker2AccId, _) = await SetupDependencies();
            var targetDate = new DateOnly(2020, 3, 1);

            // Broker 1 dividend payments
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                // Before targetDate: 100 * 1.5 - 5 = 145m
                await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = broker1AccId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 100,
                    Tax = 5m,
                    ReceivedAt = new DateOnly(2020, 2, 10)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                // After targetDate (boundary out)
                await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = broker1AccId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 200,
                    Tax = 10m,
                    ReceivedAt = new DateOnly(2020, 3, 10)
                });
            });

            // Broker 2 dividend payments
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                // Before targetDate: 50 * 1.5 - 2 = 73m
                await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = broker2AccId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 50,
                    Tax = 2m,
                    ReceivedAt = new DateOnly(2020, 2, 20)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                // After targetDate (boundary out)
                await service.AddAsync(new DividendPaymentDto
                {
                    BrokerAccountId = broker2AccId,
                    DividendId = dividendId,
                    SecuritiesQuantity = 300,
                    Tax = 15m,
                    ReceivedAt = new DateOnly(2020, 4, 1)
                });
            });

            // Verify Broker 1
            var sumB1 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, broker1AccId);
            });
            Assert.Equal(145m, sumB1);

            // Verify Broker 2
            var sumB2 = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, broker2AccId);
            });
            Assert.Equal(73m, sumB2);

            // Verify All brokers
            var sumAll = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendPaymentService>();
                return await service.GetSumTillSpecificDateAsync(targetDate, null);
            });
            Assert.Equal(218m, sumAll);
        }

        private async Task<(Guid brokerAccountId, Guid dividendId)> SetupDependencies()
        {
            var brokerId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerService>();
                return await service.AddAsync(new BrokerDto { Name = "Div Payment Broker" });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountTypeService>();
                return await service.AddAsync(new BrokerAccountTypeDto { Name = "Div Payment Type" });
            });

            var brokerAccountId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IBrokerAccountService>();
                return await service.AddAsync(new BrokerAccountDto
                {
                    Name = "Div Payment Broker Acc",
                    BrokerId = brokerId,
                    TypeId = typeId,
                    CurrencyId = CurrencyConstants.USD
                });
            });

            var secTypeId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityTypeService>();
                return await service.AddAsync(new SecurityTypeDto { Name = "Div Sec Type" });
            });

            var securityId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISecurityService>();
                var sec = await service.AddAsync(new SecurityDto
                {
                    Name = "Div Security",
                    Ticker = "DIVP",
                    TypeId = secTypeId,
                    CurrencyId = CurrencyConstants.USD,
                    ActualPrice = 100m
                }, null);
                return sec.Data!.Id;
            });

            var today = DateOnly.FromDateTime(DateTime.Now);
            var dividendId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDividendService>();
                return await service.AddAsync(new DividendDto
                {
                    SecurityId = securityId,
                    Amount = 1.5m,
                    DeclarationDate = today.AddMonths(-1),
                    SnapshotDate = today
                });
            });

            return (brokerAccountId, dividendId);
        }
    }
}
