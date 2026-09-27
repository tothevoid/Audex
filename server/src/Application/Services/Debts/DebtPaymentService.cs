using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Debts;
using Audex.Application.Interfaces.Debts;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Debts;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Audex.Application.Services.Debts
{
    public class DebtPaymentService: IDebtPaymentService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<Debt> _debtRepo;
        private readonly IRepository<DebtPayment> _debtPaymentRepo;
        private readonly IRepository<Account> _accountRepo;
        private readonly ApplicationMapper _mapper;

        public DebtPaymentService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _debtRepo = uow.CreateRepository<Debt>();
            _debtPaymentRepo = uow.CreateRepository<DebtPayment>();
            _accountRepo = uow.CreateRepository<Account>();
        }

        public async Task<DebtPaymentDto> GetByIdAsync(Guid id)
        {
            var debtPayment = await _debtPaymentRepo.GetByIdAsync(id);
            return _mapper.Map(debtPayment);
        }

        public async Task<PagedResult<DebtPaymentDto>> GetAllAsync(DebtPaymentFilterDto filter)
        {
            var builder = new ComplexQueryBuilder<DebtPayment>()
                .AddPagination(filter, payment => payment.Date, true)
                .AddJoins(GetFullHierarchyColumns);

            if (filter.DebtId.HasValue && filter.DebtId.Value != Guid.Empty)
            {
                builder.AddFilter(payment => payment.DebtId == filter.DebtId.Value);
            }

            if (filter.TagId.HasValue && filter.TagId.Value != Guid.Empty)
            {
                builder.AddFilter(payment => payment.Debt.DebtTags.Any(debtTag => debtTag.DebtTagId == filter.TagId.Value));
            }

            var pagedPayments = await _debtPaymentRepo.GetPagedAsync(builder.GetQuery());
            return _mapper.Map(pagedPayments);
        }

        public async Task<Guid> AddAsync(DebtPaymentDto debtPaymentDto)
        {
            var debtPayment = _mapper.Map(debtPaymentDto);
            debtPayment.Id = Guid.NewGuid();

            await _debtPaymentRepo.AddAsync(debtPayment);

            await UpdateLinkedEntities(debtPayment.DebtId, debtPayment.TargetAccountId, debtPaymentDto.Amount, debtPaymentDto.IsPercentagePayment);
            await _db.CommitAsync();

            return debtPayment.Id;
        }

        public async Task UpdateAsync(DebtPaymentDto updatedPaymentDto)
        {
            var currentDebtPayment = await _debtPaymentRepo.GetByIdAsync(updatedPaymentDto.Id);
            var updatedDebtPayment = _mapper.Map(updatedPaymentDto);
            _debtPaymentRepo.Update(updatedDebtPayment);

            await ActualizeDebts(currentDebtPayment, updatedDebtPayment);
            await ActualizeAccounts(currentDebtPayment, updatedDebtPayment);

            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var debtPayment = await _debtPaymentRepo.GetByIdAsync(id);

            if (debtPayment == null)
            {
               return;
            }

            await _debtPaymentRepo.DeleteAsync(id);

            await UpdateLinkedEntities(debtPayment.DebtId, debtPayment.TargetAccountId, debtPayment.Amount * -1, 
                debtPayment.IsPercentagePayment);

            await _db.CommitAsync();
        }

        private async Task ActualizeDebts(DebtPayment currentDebtPayment, DebtPayment updatedDebtPayment)
        {
            var amountChanged = currentDebtPayment.Amount != updatedDebtPayment.Amount;
            var debtChanged = currentDebtPayment.DebtId != updatedDebtPayment.DebtId;
            var percentagePaymentChanged = currentDebtPayment.IsPercentagePayment != updatedDebtPayment.IsPercentagePayment;

            if (!amountChanged && !debtChanged && !percentagePaymentChanged)
            {
                return;
            }

            if (debtChanged)
            {
                await ResetPreviousDebtChanges(currentDebtPayment);
                await UpdateLinkedDebt(updatedDebtPayment.DebtId, -1 * updatedDebtPayment.Amount);
                return;
            }

            if (percentagePaymentChanged)
            {
                var diff = updatedDebtPayment.IsPercentagePayment
                    ? currentDebtPayment.Amount
                    : updatedDebtPayment.Amount * -1;

                await UpdateLinkedDebt(updatedDebtPayment.DebtId, diff);
            }
            else if (!updatedDebtPayment.IsPercentagePayment)
            {
                await UpdateLinkedDebt(updatedDebtPayment.DebtId, currentDebtPayment.Amount - updatedDebtPayment.Amount);
            }
        }

        private async Task ActualizeAccounts(DebtPayment currentDebtPayment, DebtPayment updatedDebtPayment)
        {
            if (currentDebtPayment.TargetAccountId != updatedDebtPayment.TargetAccountId)
            {
                await UpdateLinkedAccount(currentDebtPayment.TargetAccountId, currentDebtPayment.Amount * -1);
                await UpdateLinkedAccount(updatedDebtPayment.TargetAccountId, updatedDebtPayment.Amount);
            }
            else if (currentDebtPayment.Amount != updatedDebtPayment.Amount)
            {
                await UpdateLinkedAccount(updatedDebtPayment.TargetAccountId, updatedDebtPayment.Amount - currentDebtPayment.Amount);
            }
        }

        private async Task UpdateLinkedEntities(Guid debtId, Guid accountId, decimal diff, bool isPercentagePayment)
        {
            if (!isPercentagePayment)
            {
                await UpdateLinkedDebt(debtId, -1 * diff);
            }
            
            await UpdateLinkedAccount(accountId, diff);
        }

        private async Task UpdateLinkedDebt(Guid debtId, decimal diff)
        {
            var debt = await _debtRepo.GetByIdAsync(debtId, disableTracking: false);

            debt.Amount += diff;

            _debtRepo.Update(debt);
        }


        private async Task ResetPreviousDebtChanges(DebtPayment currentDebtPayment)
        {
            if (currentDebtPayment.IsPercentagePayment)
            {
                return;
            }

            var debt = await _debtRepo.GetByIdAsync(currentDebtPayment.DebtId, disableTracking: false);

            debt.Amount += currentDebtPayment.Amount;

            _debtRepo.Update(debt);
        }

        private async Task UpdateLinkedAccount(Guid accountId, decimal diff)
        {
            var account = await _accountRepo.GetByIdAsync(accountId, disableTracking: false);

            account.Balance += diff;

            _accountRepo.Update(account);
        }

        private IQueryable<DebtPayment> GetFullHierarchyColumns(IQueryable<DebtPayment> debtPaymentQuery)
        {
            return debtPaymentQuery
                .Include(debtPayment => debtPayment.Debt.Currency)
                .Include(debtPayment => debtPayment.TargetAccount.AccountType)
                .Include(debtPayment => debtPayment.TargetAccount.Currency)
                .Include(debtPayment => debtPayment.TargetAccount.Bank);
        }
    }
}
