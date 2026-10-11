using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.Debts;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.Debts;
using Audex.Infrastructure.Constants;
using System;

namespace Audex.Application.Tests.Services.Debts
{
    public class DebtServiceTests : TestBase
    {
        public DebtServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var name = "Loan to Friend";

            var debtId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.AddAsync(new DebtDto
                {
                    Name = name,
                    Amount = 500m,
                    CurrencyId = CurrencyConstants.USD,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            Assert.NotEqual(Guid.Empty, debtId);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.GetAllAsync(false);
            });

            Assert.NotNull(all);
            Assert.Contains(all, d => d.Id == debtId && d.Name == name);
        }

        [Fact]
        public async Task TestGetAll_OnlyActiveFiltering()
        {
            var activeDebtName = "Active Debt";
            var zeroDebtName = "Zero Debt";

            var activeDebtId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.AddAsync(new DebtDto
                {
                    Name = activeDebtName,
                    Amount = 300m,
                    CurrencyId = CurrencyConstants.USD,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            var debtToBePaid = new DebtDto
            {
                Name = zeroDebtName,
                Amount = 200m,
                CurrencyId = CurrencyConstants.USD,
                Date = DateOnly.FromDateTime(DateTime.Now)
            };

            var debtToBePaidId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.AddAsync(debtToBePaid);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var debtPaymentService = sp.GetRequiredService<IDebtPaymentService>();
                var accountService = sp.GetRequiredService<IAccountService>();
                var bankService = sp.GetRequiredService<IBankService>();

                var bank = await bankService.AddAsync(new BankDto()
                {
                    Id = Guid.NewGuid(),
                    Name = "Test Bank"
                }, null);

                var accountId = await accountService.AddAsync(new AccountDto()
                {
                    AccountTypeId = AccountTypeConstants.Cash,
                    Active = true,
                    Balance = 500m,
                    CurrencyId = CurrencyConstants.USD,
                    Name = "Test",
                    BankId = bank.Id
                });

                return await debtPaymentService.AddAsync(new DebtPaymentDto()
                {
                   Id = Guid.NewGuid(),
                   Date = DateOnly.FromDateTime(DateTime.Now),
                   Amount = debtToBePaid.Amount,
                   IsPercentagePayment = false,
                   DebtId = debtToBePaidId,
                   TargetAccountId = accountId
                });
            });

            var activeDebts = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.GetAllAsync(true);
            });

            Assert.Contains(activeDebts, d => d.Id == activeDebtId);
            Assert.DoesNotContain(activeDebts, d => d.Id == debtToBePaid.Id);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var initialDebtName = "Loan to Alex";
            var updatedDebtName = "Loan to John";

            var actualAmount = 800m;
            var actualCurrency = CurrencyConstants.EUR;
            var actualDate = DateOnly.FromDateTime(DateTime.Now.AddDays(2));

            var debtId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.AddAsync(new DebtDto
                {
                    Name = initialDebtName,
                    Amount = 1000m,
                    CurrencyId = CurrencyConstants.USD,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                await service.UpdateAsync(new DebtDto
                {
                    Id = debtId,
                    Name = updatedDebtName,
                    Amount = actualAmount,
                    CurrencyId = actualCurrency,
                    Date = actualDate
                });
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.GetAllAsync(false);
            });

            var updated = all.FirstOrDefault(d => d.Id == debtId);
            Assert.NotNull(updated);
            Assert.Equal(updatedDebtName, updated.Name);
            Assert.Equal(actualAmount, updated.Amount);
            Assert.Equal(actualCurrency, updated.CurrencyId);
            Assert.Equal(actualDate, updated.Date);
        }

        [Fact]
        public async Task TestDelete()
        {
            var debtId = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.AddAsync(new DebtDto
                {
                    Name = "Debt to Delete",
                    Amount = 200m,
                    CurrencyId = CurrencyConstants.USD,
                    Date = DateOnly.FromDateTime(DateTime.Now)
                });
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                await service.DeleteAsync(debtId);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IDebtService>();
                return await service.GetAllAsync(false);
            });

            Assert.DoesNotContain(all, d => d.Id == debtId);
        }
    }
}
