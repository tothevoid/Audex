using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Tests.Services.Accounts
{
    public class AccountServiceTests : TestBase
    {
        public AccountServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {

        }

        [Fact]
        public async Task TestGetAll()
        {
            var activeAccountsBefore = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllAsync(true)).Count();
            });

            var allAccountsBefore = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllAsync(false)).Count();
            });

            var activeAccountsToCreate = 15;
            var nonActiveAccountsToCreate = 12;

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();

                foreach (var account in Enumerable.Range(0, activeAccountsToCreate))
                {
                    await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), 
                        account.ToString(), AccountTypeConstants.Cash, CurrencyConstants.USD, true));
                }

                foreach (var account in Enumerable.Range(0, nonActiveAccountsToCreate))
                {
                    await accountsService.AddAsync(CreateAccount(Guid.NewGuid(),
                        account.ToString(), AccountTypeConstants.Cash, CurrencyConstants.USD, false));
                }
            });

            var activeAccountsAfter = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllAsync(true)).Count();
            });

            var allAccountsAfter = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllAsync(false)).Count();
            });

            Assert.Equal(activeAccountsBefore + activeAccountsToCreate, activeAccountsAfter);
            Assert.Equal(allAccountsBefore + activeAccountsToCreate + nonActiveAccountsToCreate, allAccountsAfter);
        }

        [Fact]
        public async Task GetAllByTypesTest()
        {
            var activeCashAccountsBefore = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllByTypesAsync(new Guid[] { AccountTypeConstants.Cash}, true)).Count();
            });

            var newAccountTypeId = Guid.NewGuid();
            var newAccountTypeAccounts = 15;

            await ExecuteScopeAsync(async sp =>
            {
                var typesService = sp.GetRequiredService<IAccountTypeService>();
                var accountsService = sp.GetRequiredService<IAccountService>();

                await typesService.AddAsync(new AccountTypeDto() { Id = newAccountTypeId, Name = "Test", Active = true });

                foreach (var account in Enumerable.Range(0, newAccountTypeAccounts))
                {
                    await accountsService.AddAsync(CreateAccount(Guid.NewGuid(),
                        account.ToString(), newAccountTypeId, CurrencyConstants.USD, true));
                }
            });

            var activeCashAccountsAfter = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllByTypesAsync(new Guid[] { AccountTypeConstants.Cash }, true)).Count();
            });

            var newAccountTypeActiveAccountsAfter = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return (await accountsService.GetAllByTypesAsync(new Guid[] { newAccountTypeId }, true)).Count();
            });

            Assert.Equal(activeCashAccountsBefore, activeCashAccountsAfter);
            Assert.Equal(newAccountTypeAccounts, newAccountTypeActiveAccountsAfter);
        }

        [Fact]
        public async Task TestGetById_WhenExists_ReturnsAccount()
        {
            var accountName = "GetById Account";

            var createdId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), accountName, AccountTypeConstants.Cash, CurrencyConstants.USD, true, 500));
            });

            var account = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.GetByIdAsync(createdId);
            });

            Assert.NotNull(account);
            Assert.Equal(createdId, account.Id);
            Assert.Equal(accountName, account.Name);
            Assert.Equal(500, account.Balance);
        }

        [Fact]
        public async Task TestGetById_WhenNotExists_ReturnsNull()
        {
            var account = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.GetByIdAsync(Guid.NewGuid());
            });

            Assert.Null(account);
        }

        [Fact]
        public async Task TestAdd_CreatesAccountAndReturnsGuid()
        {
            var dto = CreateAccount(Guid.Empty, "New Added Account", AccountTypeConstants.Cash, CurrencyConstants.USD, true, 250);

            var createdId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(dto);
            });

            Assert.NotEqual(Guid.Empty, createdId);

            var fetched = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.GetByIdAsync(createdId);
            });

            Assert.NotNull(fetched);
            Assert.Equal("New Added Account", fetched.Name);
            Assert.Equal(250, fetched.Balance);
        }

        [Fact]
        public async Task TestUpdate_BalanceChanged_CreatesSystemTransaction()
        {
            var initialBalance = 100m;
            var updatedBalance = 250m;

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), "Update Balance Test", AccountTypeConstants.Cash, CurrencyConstants.USD, true, initialBalance));
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                var accountDto = await accountsService.GetByIdAsync(accountId);
                accountDto.Balance = updatedBalance;
                accountDto.Name = "Updated Name";
                await accountsService.UpdateAsync(accountDto);
            });

            var (updatedAccount, systemTxCount) = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var txRepo = uow.CreateRepository<Transaction>();

                var acc = await accountsService.GetByIdAsync(accountId);
                var txs = await txRepo.GetAllAsync(t => t.AccountId == accountId && t.IsSystem);
                return (acc, txs.Count());
            });

            Assert.NotNull(updatedAccount);
            Assert.Equal("Updated Name", updatedAccount.Name);
            Assert.Equal(updatedBalance, updatedAccount.Balance);
            Assert.Equal(1, systemTxCount);
        }

        [Fact]
        public async Task TestUpdate_BalanceUnchanged_DoesNotCreateSystemTransaction()
        {
            var balance = 100m;

            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), "Update Same Balance", AccountTypeConstants.Cash, CurrencyConstants.USD, true, balance));
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                var accountDto = await accountsService.GetByIdAsync(accountId);
                accountDto.Name = "Renamed Only";
                await accountsService.UpdateAsync(accountDto);
            });

            var systemTxCount = await ExecuteScopeAsync(async sp =>
            {
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var txRepo = uow.CreateRepository<Transaction>();
                var txs = await txRepo.GetAllAsync(t => t.AccountId == accountId && t.IsSystem);
                return txs.Count();
            });

            Assert.Equal(0, systemTxCount);
        }

        [Fact]
        public async Task TestUpdate_AccountNotFound_DoesNotThrow()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                var nonExistentAccount = CreateAccount(Guid.NewGuid(), "Ghost", AccountTypeConstants.Cash, CurrencyConstants.USD, true);
                await accountsService.UpdateAsync(nonExistentAccount);
            });
        }

        [Fact]
        public async Task TestDelete_RemovesAccount()
        {
            var accountId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), "To Delete", AccountTypeConstants.Cash, CurrencyConstants.USD, true));
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                await accountsService.DeleteAsync(accountId);
            });

            var deleted = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.GetByIdAsync(accountId);
            });

            Assert.Null(deleted);
        }

        [Fact]
        public async Task TestTransfer_Success_UpdatesBalancesAndCreatesTransactions()
        {
            var fromId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), "From Account", AccountTypeConstants.Cash, CurrencyConstants.USD, true, 1000m));
            });

            var toId = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.AddAsync(CreateAccount(Guid.NewGuid(), "To Account", AccountTypeConstants.Cash, CurrencyConstants.USD, true, 200m));
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                await accountsService.TransferAsync(new AccountTransferDto
                {
                    From = fromId,
                    To = toId,
                    Balance = 300m,
                    Fee = 10m
                });
            });

            var (fromAcc, toAcc, fromTxsCount, toTxsCount) = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var txRepo = uow.CreateRepository<Transaction>();

                var from = await accountsService.GetByIdAsync(fromId);
                var to = await accountsService.GetByIdAsync(toId);
                var fromTxs = await txRepo.GetAllAsync(t => t.AccountId == fromId);
                var toTxs = await txRepo.GetAllAsync(t => t.AccountId == toId);

                return (from, to, fromTxs.Count(), toTxs.Count());
            });

            Assert.Equal(690m, fromAcc.Balance); // 1000 - 300 - 10
            Assert.Equal(500m, toAcc.Balance);   // 200 + 300
            Assert.True(fromTxsCount >= 1);
            Assert.True(toTxsCount >= 1);
        }

        [Fact]
        public async Task TestTransfer_AccountNotFound_ThrowsArgumentException()
        {
            await Assert.ThrowsAsync<ArgumentException>(async () =>
            {
                await ExecuteScopeAsync(async sp =>
                {
                    var accountsService = sp.GetRequiredService<IAccountService>();
                    await accountsService.TransferAsync(new AccountTransferDto
                    {
                        From = Guid.NewGuid(),
                        To = Guid.NewGuid(),
                        Balance = 100m,
                        Fee = 0m
                    });
                });
            });
        }

        [Fact]
        public async Task TestGetSummary_ReturnsAggregatedBalancesByCurrency()
        {
            var usdAcc1 = Guid.NewGuid();
            var usdAcc2 = Guid.NewGuid();
            var usdInactive = Guid.NewGuid();

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                await accountsService.AddAsync(CreateAccount(usdAcc1, "Summary USD 1", AccountTypeConstants.Cash, CurrencyConstants.USD, true, 150m));
                await accountsService.AddAsync(CreateAccount(usdAcc2, "Summary USD 2", AccountTypeConstants.Cash, CurrencyConstants.USD, true, 350m));
                await accountsService.AddAsync(CreateAccount(usdInactive, "Summary USD Inactive", AccountTypeConstants.Cash, CurrencyConstants.USD, false, 500m));
            });

            var summaries = await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                return await accountsService.GetSummaryAsync();
            });

            Assert.NotNull(summaries);
            var usdSummary = summaries.FirstOrDefault(s => s.Name == "USD");
            Assert.NotNull(usdSummary);
            Assert.True(usdSummary.Summary >= 500m); // 150 + 350 active accounts
        }

        [Fact]
        public async Task TestGetAll_FiltersByCurrencyAndAccountType()
        {
            var targetAccount = Guid.NewGuid();
            var otherCurrencyAccount = Guid.NewGuid();
            var otherTypeAccount = Guid.NewGuid();

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();
                await accountsService.AddAsync(CreateAccount(targetAccount, "Target Filter Acc", AccountTypeConstants.Cash, CurrencyConstants.USD, true));
                await accountsService.AddAsync(CreateAccount(otherCurrencyAccount, "Other Currency Acc", AccountTypeConstants.Cash, CurrencyConstants.EUR, true));
                await accountsService.AddAsync(CreateAccount(otherTypeAccount, "Other Type Acc", AccountTypeConstants.DebitCard, CurrencyConstants.USD, true));
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountsService = sp.GetRequiredService<IAccountService>();

                // Filter by USD only
                var usdAccounts = (await accountsService.GetAllAsync(false, currencyId: CurrencyConstants.USD)).ToList();
                Assert.Contains(usdAccounts, a => a.Id == targetAccount);
                Assert.Contains(usdAccounts, a => a.Id == otherTypeAccount);
                Assert.DoesNotContain(usdAccounts, a => a.Id == otherCurrencyAccount);

                // Filter by Cash only
                var cashAccounts = (await accountsService.GetAllAsync(false, accountTypeId: AccountTypeConstants.Cash)).ToList();
                Assert.Contains(cashAccounts, a => a.Id == targetAccount);
                Assert.Contains(cashAccounts, a => a.Id == otherCurrencyAccount);
                Assert.DoesNotContain(cashAccounts, a => a.Id == otherTypeAccount);

                // Filter by both USD and Cash
                var bothAccounts = (await accountsService.GetAllAsync(false, currencyId: CurrencyConstants.USD, accountTypeId: AccountTypeConstants.Cash)).ToList();
                Assert.Contains(bothAccounts, a => a.Id == targetAccount);
                Assert.DoesNotContain(bothAccounts, a => a.Id == otherCurrencyAccount);
                Assert.DoesNotContain(bothAccounts, a => a.Id == otherTypeAccount);
            });
        }

        private AccountDto CreateAccount(Guid id, string name, Guid typeId, Guid currencyId, bool active, decimal balance = 100) => new()
        {
            Id = id, 
            Active = active, 
            Name = name, 
            AccountTypeId = typeId,
            Balance = balance,
            CreatedOn = DateOnly.FromDateTime(DateTime.Now),
            CurrencyId = currencyId,
        };
    }
}
