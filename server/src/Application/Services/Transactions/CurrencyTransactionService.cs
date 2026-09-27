using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Audex.Shared.Common;

namespace Audex.Application.Services.Transactions
{
    public class CurrencyTransactionService: ICurrencyTransactionService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<CurrencyTransaction> _currencyTransactionRepo;
        private readonly IRepository<Account> _accountRepo;
        private readonly ApplicationMapper _mapper;

        public CurrencyTransactionService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _currencyTransactionRepo = uow.CreateRepository<CurrencyTransaction>();
            _accountRepo = uow.CreateRepository<Account>();
        }

        public async Task<PagedResult<CurrencyTransactionDto>> GetAllAsync(CurrencyTransactionFilterDto filter)
        {
            var builder = new ComplexQueryBuilder<CurrencyTransaction>()
                .AddPagination(filter, transaction => transaction.Date, isDescending: true)
                .AddJoins(GetFullHierarchyColumns);

            if (filter.AccountId.HasValue && filter.AccountId.Value != Guid.Empty)
            {
                builder.AddFilter(transaction => transaction.SourceAccountId == filter.AccountId.Value || transaction.DestinationAccountId == filter.AccountId.Value);
            }

            var pagedTransactions = await _currencyTransactionRepo.GetPagedAsync(builder.GetQuery());
            return _mapper.Map(pagedTransactions);
        }

        public async Task UpdateAsync(CurrencyTransactionDto currencyTransactionDto)
        {
            var currentTransaction = await _currencyTransactionRepo.GetByIdAsync(currencyTransactionDto.Id);
            if (currentTransaction == null)
            {
                throw new ArgumentException(nameof(currencyTransactionDto.Id));
            }

            var updatedTransaction = _mapper.Map(currencyTransactionDto);
            _currencyTransactionRepo.Update(updatedTransaction);

            await ActualizeAccountsAsync(currentTransaction, updatedTransaction);
            await _db.CommitAsync();
        }

        public async Task<Guid> AddAsync(CurrencyTransactionDto currencyTransactionDto)
        {
            var currencyTransaction = _mapper.Map(currencyTransactionDto);
            currencyTransaction.Id = Guid.NewGuid();

            await _currencyTransactionRepo.AddAsync(currencyTransaction);

            await UpdateLinkedAccountsAsync(
                currencyTransaction.SourceAccountId,
                currencyTransaction.DestinationAccountId,
                currencyTransaction.Amount,
                currencyTransaction.Rate);

            await _db.CommitAsync();
            return currencyTransaction.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            var transaction = await _currencyTransactionRepo.GetByIdAsync(id);
            if (transaction == null)
            {
                throw new ArgumentException(nameof(id));
            }

            await _currencyTransactionRepo.DeleteAsync(transaction.Id);

            await UpdateLinkedAccountsAsync(
                transaction.SourceAccountId,
                transaction.DestinationAccountId,
                -transaction.Amount,
                transaction.Rate);

            await _db.CommitAsync();
        }

        private async Task ActualizeAccountsAsync(CurrencyTransaction currentTransaction, CurrencyTransaction updatedTransaction)
        {
            var oldSpent = currentTransaction.Amount * currentTransaction.Rate;
            var oldReceived = currentTransaction.Amount;
            var newSpent = updatedTransaction.Amount * updatedTransaction.Rate;
            var newReceived = updatedTransaction.Amount;

            if (currentTransaction.SourceAccountId != updatedTransaction.SourceAccountId)
            {
                await UpdateLinkedAccountAsync(currentTransaction.SourceAccountId, oldSpent);
                await UpdateLinkedAccountAsync(updatedTransaction.SourceAccountId, -newSpent);
            }
            else if (oldSpent != newSpent)
            {
                await UpdateLinkedAccountAsync(updatedTransaction.SourceAccountId, oldSpent - newSpent);
            }

            if (currentTransaction.DestinationAccountId != updatedTransaction.DestinationAccountId)
            {
                await UpdateLinkedAccountAsync(currentTransaction.DestinationAccountId, -oldReceived);
                await UpdateLinkedAccountAsync(updatedTransaction.DestinationAccountId, newReceived);
            }
            else if (oldReceived != newReceived)
            {
                await UpdateLinkedAccountAsync(updatedTransaction.DestinationAccountId, newReceived - oldReceived);
            }
        }

        private async Task UpdateLinkedAccountsAsync(Guid sourceAccountId, Guid destAccountId, decimal amount, decimal rate)
        {
            await UpdateLinkedAccountAsync(sourceAccountId, -amount * rate);
            await UpdateLinkedAccountAsync(destAccountId, amount);
        }

        private async Task UpdateLinkedAccountAsync(Guid accountId, decimal diff)
        {
            if (accountId == Guid.Empty || diff == 0)
            {
                return;
            }

            var account = await _accountRepo.GetByIdAsync(accountId, disableTracking: false);
            if (account != null)
            {
                account.Balance += diff;
                _accountRepo.Update(account);
            }
        }

        public async Task<CurrencyTransactionDto> GetByIdAsync(Guid id)
        {
            var entity = await _currencyTransactionRepo.GetByIdAsync(id, include: GetFullHierarchyColumns);
            return _mapper.Map(entity);
        }

        public async Task<CurrencyAccountSummaryDto> GetSummaryByAccountIdAsync(Guid accountId)
        {
            var query = new ComplexQueryBuilder<CurrencyTransaction>()
                .AddFilter(transaction => transaction.SourceAccountId == accountId || transaction.DestinationAccountId == accountId)
                .AddJoins(GetFullHierarchyColumns)
                .GetQuery();

            var transactions = (await _currencyTransactionRepo.GetAllAsync(query)).ToList();

            decimal totalPnl = 0;
            foreach (var transaction in transactions)
            {
                var currentRate = transaction.DestinationAccount?.Currency?.Rate ?? 0;
                var pnl = (currentRate - transaction.Rate) * transaction.Amount;
                totalPnl += pnl;
            }

            return new CurrencyAccountSummaryDto
            {
                TotalPnl = totalPnl,
                TransactionsCount = transactions.Count
            };
        }

        private IQueryable<CurrencyTransaction> GetFullHierarchyColumns(
            IQueryable<CurrencyTransaction> currencyTransactionQuery)
        {
            return currencyTransactionQuery
                .Include(currencyTransaction => currencyTransaction.SourceAccount.Currency)
                .Include(currencyTransaction => currencyTransaction.SourceAccount.AccountType)
                .Include(currencyTransaction => currencyTransaction.SourceAccount.Bank)
                .Include(currencyTransaction => currencyTransaction.DestinationAccount.Currency)
                .Include(currencyTransaction => currencyTransaction.DestinationAccount.AccountType)
                .Include(currencyTransaction => currencyTransaction.DestinationAccount.Bank);
        }
    }
}
