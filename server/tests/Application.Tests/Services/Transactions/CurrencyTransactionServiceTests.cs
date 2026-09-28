using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Shared.Common;

namespace Audex.Application.Tests.Services.Transactions
{
    public class CurrencyTransactionServiceTests : TestBase
    {
        public CurrencyTransactionServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetById()
        {
            var (sourceId, destId) = await SetupAccounts();

            var dto = new CurrencyTransactionDto
            {
                Name = "USD to EUR Exchange",
                SourceAccountId = sourceId,
                DestinationAccountId = destId,
                Amount = 1000m,
                Rate = 0.85m,
                Date = DateOnly.FromDateTime(DateTime.Now)
            };

            var id = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.AddAsync(dto);
            });

            Assert.NotEqual(Guid.Empty, id);

            var fetched = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetByIdAsync(id);
            });

            Assert.NotNull(fetched);
            Assert.Equal("USD to EUR Exchange", fetched.Name);
            Assert.Equal(1000m, fetched.Amount);
            Assert.Equal(0.85m, fetched.Rate);

            var (sourceAcc, destAcc) = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return (await accService.GetByIdAsync(sourceId), await accService.GetByIdAsync(destId));
            });

            // Initial 5000 USD - (1000 * 0.85 USD) = 4150 USD
            Assert.Equal(4150m, sourceAcc.Balance);
            // Initial 2000 EUR + 1000 EUR = 3000 EUR
            Assert.Equal(3000m, destAcc.Balance);
        }

        [Fact]
        public async Task TestGetAllByAccountId()
        {
            var (sourceId, destId) = await SetupAccounts();

            var transactionDto = new CurrencyTransactionDto
            {
                Name = "Fx Transfer",
                SourceAccountId = sourceId,
                DestinationAccountId = destId,
                Amount = 500m,
                Rate = 0.9m,
                Date = DateOnly.FromDateTime(DateTime.Now)
            };

            var transactionId = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICurrencyTransactionService>();
                return await service.AddAsync(transactionDto);
            });

            var sourceTransactions = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetAllAsync(new CurrencyTransactionFilterDto
                {
                    AccountId = sourceId,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            Assert.NotNull(sourceTransactions);
            Assert.Contains(sourceTransactions.Items, transaction => transaction.Id == transactionId);

            var destTransactions = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetAllAsync(new CurrencyTransactionFilterDto
                {
                    AccountId = destId,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });
            });

            Assert.NotNull(destTransactions);
            Assert.Contains(destTransactions.Items, transaction => transaction.Id == transactionId);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var (sourceId, destId) = await SetupAccounts();

            var id = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.AddAsync(new CurrencyTransactionDto
                {
                    Name = "Initial Fx",
                    SourceAccountId = sourceId,
                    DestinationAccountId = destId,
                    Amount = 200m,
                    Rate = 1.5m,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            // Initial: Source = 5000 - (200 * 1.5) = 4700; Dest = 2000 + 200 = 2200
            var (sourceAfterAdd, destAfterAdd) = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return (await accService.GetByIdAsync(sourceId), await accService.GetByIdAsync(destId));
            });
            Assert.Equal(4700m, sourceAfterAdd.Balance);
            Assert.Equal(2200m, destAfterAdd.Balance);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                var item = await service.GetByIdAsync(id);
                item.Name = "Updated Fx";
                item.Amount = 300m;
                item.Rate = 2.0m;
                item.SourceAccount = null;
                item.DestinationAccount = null;
                await service.UpdateAsync(item);
            });

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetByIdAsync(id);
            });

            Assert.NotNull(updated);
            Assert.Equal("Updated Fx", updated.Name);
            Assert.Equal(300m, updated.Amount);
            Assert.Equal(2.0m, updated.Rate);

            // Updated: Source = 5000 - (300 * 2.0) = 4400; Dest = 2000 + 300 = 2300
            var (sourceAfterUpdate, destAfterUpdate) = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return (await accService.GetByIdAsync(sourceId), await accService.GetByIdAsync(destId));
            });
            Assert.Equal(4400m, sourceAfterUpdate.Balance);
            Assert.Equal(2300m, destAfterUpdate.Balance);
        }

        [Fact]
        public async Task TestDelete()
        {
            var (sourceId, destId) = await SetupAccounts();

            var id = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.AddAsync(new CurrencyTransactionDto
                {
                    Name = "To Delete Fx",
                    SourceAccountId = sourceId,
                    DestinationAccountId = destId,
                    Amount = 100m,
                    Rate = 1.2m,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            // After Add: Source = 5000 - (100 * 1.2) = 4880; Dest = 2000 + 100 = 2100
            var (sourceAfterAdd, destAfterAdd) = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return (await accService.GetByIdAsync(sourceId), await accService.GetByIdAsync(destId));
            });
            Assert.Equal(4880m, sourceAfterAdd.Balance);
            Assert.Equal(2100m, destAfterAdd.Balance);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                await service.DeleteAsync(id);
            });

            var deleted = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetByIdAsync(id);
            });

            Assert.Null(deleted);

            // After Delete: restored to 5000 and 2000
            var (sourceAfterDelete, destAfterDelete) = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return (await accService.GetByIdAsync(sourceId), await accService.GetByIdAsync(destId));
            });
            Assert.Equal(5000m, sourceAfterDelete.Balance);
            Assert.Equal(2000m, destAfterDelete.Balance);
        }

        [Fact]
        public async Task TestGetSummaryByAccountId()
        {
            var (sourceId, destId) = await SetupAccounts();

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                await service.AddAsync(new CurrencyTransactionDto
                {
                    Name = "FX 1",
                    SourceAccountId = sourceId,
                    DestinationAccountId = destId,
                    Amount = 1000m,
                    Rate = 1.10m,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
                await service.AddAsync(new CurrencyTransactionDto
                {
                    Name = "FX 2",
                    SourceAccountId = sourceId,
                    DestinationAccountId = destId,
                    Amount = 500m,
                    Rate = 1.05m,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            var summary = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetSummaryByAccountIdAsync(sourceId);
            });

            Assert.NotNull(summary);
            Assert.Equal(2, summary.TransactionsCount);
        }

        [Fact]
        public async Task TestPaginationAndSorting()
        {
            var (sourceId, destId) = await SetupAccounts();

            await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICurrencyTransactionService>();
                await service.AddAsync(new CurrencyTransactionDto
                {
                    Name = "FX Older",
                    SourceAccountId = sourceId,
                    DestinationAccountId = destId,
                    Amount = 100m,
                    Rate = 1.0m,
                    Date = new DateOnly(2025, 1, 1)
                });
                await service.AddAsync(new CurrencyTransactionDto
                {
                    Name = "FX Newer",
                    SourceAccountId = sourceId,
                    DestinationAccountId = destId,
                    Amount = 200m,
                    Rate = 1.0m,
                    Date = new DateOnly(2025, 6, 1)
                });
            });

            var pageOne = await ExecuteScopeAsync(async serviceProvider =>
            {
                var service = serviceProvider.GetRequiredService<ICurrencyTransactionService>();
                return await service.GetAllAsync(new CurrencyTransactionFilterDto
                {
                    AccountId = sourceId,
                    PageIndex = 1,
                    RecordsQuantity = 1
                });
            });

            Assert.NotNull(pageOne);
            Assert.Equal(2, pageOne.TotalCount);
            Assert.Single(pageOne.Items);
            Assert.Equal("FX Newer", pageOne.Items.First().Name);
        }

        private async Task<(Guid sourceId, Guid destId)> SetupAccounts()
        {
            var sourceId = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return await accService.AddAsync(new AccountDto
                {
                    Active = true,
                    Name = "Fx Source Acc",
                    AccountTypeId = AccountTypeConstants.Cash,
                    CurrencyId = CurrencyConstants.USD,
                    Balance = 5000m,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            var destId = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return await accService.AddAsync(new AccountDto
                {
                    Active = true,
                    Name = "Fx Dest Acc",
                    AccountTypeId = AccountTypeConstants.Cash,
                    CurrencyId = CurrencyConstants.EUR,
                    Balance = 2000m,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            return (sourceId, destId);
        }
    }
}
