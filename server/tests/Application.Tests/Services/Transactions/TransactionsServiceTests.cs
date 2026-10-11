using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Transactions;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Transactions
{
    public class TransactionsServiceTests : TestBase
    {
        public TransactionsServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetById()
        {
            var (accountId, typeId) = await SetupDependencies();

            var txDto = new TransactionDto
            {
                Amount = 150m,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                Name = "Groceries",
                AccountId = accountId,
                TransactionTypeId = typeId
            };

            var created = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                return await service.AddAsync(txDto);
            });

            Assert.NotNull(created);
            Assert.NotEqual(Guid.Empty, created.Id);
            Assert.Equal("Groceries", created.Name);
            Assert.Equal(150m, created.Amount);

            var fetched = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                return await service.GetByIdAsync(created.Id);
            });

            Assert.NotNull(fetched);
            Assert.Equal(created.Id, fetched.Id);

            // Verify account balance was updated
            var accountBalance = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                var acc = await accService.GetByIdAsync(accountId);
                return acc.Balance;
            });

            Assert.Equal(1150m, accountBalance); // Initial 1000 + 150
        }

        [Fact]
        public async Task TestGetAll_FiltersByMonthYearAndSystem()
        {
            var (accountId, typeId) = await SetupDependencies();
            var now = DateTime.UtcNow;

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                await service.AddAsync(new TransactionDto
                {
                    Amount = 50m,
                    Date = DateOnly.FromDateTime(now),
                    Name = "Regular Tx",
                    AccountId = accountId,
                    TransactionTypeId = typeId
                });
            });

            var allRegular = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                return await service.GetAllAsync(now.Month, now.Year, false);
            });

            Assert.NotNull(allRegular);
            Assert.Contains(allRegular, t => t.Name == "Regular Tx");
        }

        [Fact]
        public async Task TestUpdate_RecalculatesAccountBalance()
        {
            var (accountId, typeId) = await SetupDependencies();

            var created = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                return await service.AddAsync(new TransactionDto
                {
                    Amount = 200m,
                    Date = DateOnly.FromDateTime(DateTime.UtcNow),
                    Name = "Initial Tx",
                    AccountId = accountId,
                    TransactionTypeId = typeId
                });
            });

            // Update transaction amount from 200 to 500
            created.Amount = 500m;
            created.Name = "Updated Tx Amount";
            created.Account = null;
            created.TransactionType = null;

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                await service.UpdateAsync(created);
            });

            var accountBalance = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                var acc = await accService.GetByIdAsync(accountId);
                return acc.Balance;
            });

            // Initial 1000 + 500
            Assert.Equal(1500m, accountBalance);
        }

        [Fact]
        public async Task TestDelete_RevertsAccountBalance()
        {
            var (accountId, typeId) = await SetupDependencies();

            var created = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                return await service.AddAsync(new TransactionDto
                {
                    Amount = 300m,
                    Date = DateOnly.FromDateTime(DateTime.UtcNow),
                    Name = "Tx To Delete",
                    AccountId = accountId,
                    TransactionTypeId = typeId
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionsService>();
                await service.DeleteAsync(created.Id);
            });

            var accountBalance = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                var acc = await accService.GetByIdAsync(accountId);
                return acc.Balance;
            });

            // 1000 initial + 300 - 300 = 1000
            Assert.Equal(1000m, accountBalance);
        }

        private async Task<(Guid accountId, Guid typeId)> SetupDependencies()
        {
            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var accService = sp.GetRequiredService<IAccountService>();
                return await accService.AddAsync(new AccountDto
                {
                    Active = true,
                    Name = "Tx Test Account",
                    AccountTypeId = AccountTypeConstants.Cash,
                    CurrencyId = CurrencyConstants.USD,
                    Balance = 1000m,
                    CreatedOn = DateOnly.FromDateTime(DateTime.UtcNow)
                });
            });

            var typeId = await ExecuteScopeAsync(async sp =>
            {
                var typeService = sp.GetRequiredService<ITransactionTypeService>();
                var added = await typeService.AddAsync(new TransactionTypeDto { Active = true, Name = "Tx Category" }, null);
                return added.Id;
            });

            return (accountId, typeId);
        }
    }
}
