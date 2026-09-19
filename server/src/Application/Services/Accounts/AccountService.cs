using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Accounts;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Mappings;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Infrastructure.Entities.Accounts;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Queries;

namespace Audex.Application.Services.Accounts
{
    public class AccountService : IAccountService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<Account> _accountRepo;
        private readonly IRepository<Transaction> _transactionRepo;
        private readonly ApplicationMapper _mapper;
        public AccountService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _accountRepo = uow.CreateRepository<Account>();
            _transactionRepo = uow.CreateRepository<Transaction>();
        }

        public async Task<IEnumerable<AccountDto>> GetAllAsync(bool onlyActive = false, Guid? currencyId = null, Guid? accountTypeId = null)
        {
            var builder = new ComplexQueryBuilder<Account>();

            if (onlyActive)
            {
                builder.AddFilter(account => account.Active);
            }

            if (currencyId.HasValue)
            {
                builder.AddFilter(account => account.CurrencyId == currencyId.Value);
            }

            if (accountTypeId.HasValue)
            {
                builder.AddFilter(account => account.AccountTypeId == accountTypeId.Value);
            }

            var query = builder
                .AddOrder(account => account.Name)
                .AddJoins(GetFullHierarchyColumns)
                .GetQuery();

            var accounts = await _accountRepo.GetAllAsync(query);
            return _mapper.Map(accounts);
        }

        public async Task<AccountDto> GetByIdAsync(Guid id)
        {
            var account = await _accountRepo.GetByIdAsync(id, GetFullHierarchyColumns);
            return _mapper.Map(account);
        }

        public async Task<IEnumerable<AccountDto>> GetAllByTypesAsync(Guid[] typesIds, bool onlyActive = false)
        {
            Expression<Func<Account, bool>> filter = null;

            filter = account =>
                (!onlyActive || account.Active) && typesIds.Contains(account.AccountTypeId);

            var transactions = await _accountRepo.GetAllAsync(filter, GetFullHierarchyColumns);
            return _mapper.Map(transactions);
        }

        public async Task UpdateAsync(AccountDto accountDto)
        {
            var account = _mapper.Map(accountDto);

            var currentAccountState = await _accountRepo.GetByIdAsync(account.Id);
            if (currentAccountState == null)
            {
                return;
            }

            _accountRepo.Update(account);

            var balanceDiff = account.Balance - currentAccountState.Balance;
            if (Math.Abs(balanceDiff) > 0.0001m)
            {
                var transaction = GenerateSystemTransaction(account,
                    $"{currentAccountState.Balance} => {account.Balance}", balanceDiff);
                await _transactionRepo.AddAsync(transaction);
            }

            await _db.CommitAsync();
        }

        public async Task<Guid> AddAsync(AccountDto accountDto)
        {
            var account = _mapper.Map(accountDto);
            account.Id = Guid.NewGuid();
            await _accountRepo.AddAsync(account);
            await _db.CommitAsync();
            return account.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _accountRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        public async Task TransferAsync(AccountTransferDto transferDto)
        {
            var accounts = (await _accountRepo.GetAllAsync(account => 
                account.Id == transferDto.From || account.Id == transferDto.To)).ToList();
            var fromAccount = accounts.FirstOrDefault(account => account.Id == transferDto.From);
            var toAccount = accounts.FirstOrDefault(account => account.Id == transferDto.To);

            if (fromAccount == null || toAccount == null)
            {
                throw new ArgumentException(nameof(transferDto));
            }

            fromAccount.Balance -= transferDto.Balance + transferDto.Fee;
            toAccount.Balance += transferDto.Balance;

            var fromAccountTransaction = GenerateSystemTransaction(fromAccount, $"-{transferDto.Balance} => {toAccount.Name} (Fee: {transferDto.Fee})", 
                -1 * transferDto.Balance - transferDto.Fee);
            var toAccountTransaction = GenerateSystemTransaction(toAccount, $"+{transferDto.Balance} <= {fromAccount.Name}", transferDto.Balance);

            _accountRepo.Update(fromAccount);
            _accountRepo.Update(toAccount);

            var tasks = new List<Task>()
            {
                _transactionRepo.AddAsync(fromAccountTransaction),
                _transactionRepo.AddAsync(toAccountTransaction),
            };

            await Task.WhenAll(tasks);
            await _db.CommitAsync();
        }

        public async Task<AccountCurrencySummaryDto[]> GetSummaryAsync()
        {
            //TODO: Group on db level
            var accounts = await _accountRepo.GetAllAsync(account => account.Active, GetFullHierarchyColumns);
            var groups = accounts.GroupBy(account => account.CurrencyId)
                .Select(group => new AccountCurrencySummaryDto()
                {
                    Name = group.First().Currency.Name, 
                    Summary = group.Sum(account => account.Balance)
                });

            return groups.ToArray();
        }

        private Transaction GenerateSystemTransaction(Account account, string title, decimal balance)
        {
            return new Transaction()
            {
                Id = Guid.NewGuid(),
                Account = account,
                AccountId = account.Id,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                Name = title,
                TransactionTypeId = TransactionTypeConstants.System,
                Amount = balance,
                IsSystem = true
            };
        }

        private IQueryable<Account> GetFullHierarchyColumns(IQueryable<Account> accountQuery)
        {
            return accountQuery
                .Include(account => account.Currency)
                .Include(account => account.AccountType)
                .Include(account => account.Bank);
        }
    }
}