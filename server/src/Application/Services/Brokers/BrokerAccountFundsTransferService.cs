using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Common;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Audex.Application.Services.Brokers
{
    public class BrokerAccountFundsTransferService : IBrokerAccountFundsTransferService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<BrokerAccountFundsTransfer> _transfersRepo;
        private readonly IRepository<Account> _accountRepo;
        private readonly IRepository<BrokerAccount> _brokerAccountRepo;
        private readonly IBrokerAccountService _brokerAccountService;
        private readonly IAccountService _accountService;
        private readonly ApplicationMapper _mapper;

        public BrokerAccountFundsTransferService(IUnitOfWork db, ApplicationMapper mapper, IBrokerAccountService brokerAccountService, IAccountService accountService)
        {
            _db = db;
            _mapper = mapper;
            _transfersRepo = db.CreateRepository<BrokerAccountFundsTransfer>();
            _accountRepo = db.CreateRepository<Account>();
            _brokerAccountRepo = db.CreateRepository<BrokerAccount>();
            _brokerAccountService = brokerAccountService;
            _accountService = accountService;
        }

        public async Task<PagedResult<BrokerAccountFundsTransferDto>> GetAllAsync(BrokerAccountFundsTransferFilterDto filter = null)
        {
            filter ??= new BrokerAccountFundsTransferFilterDto();

            var builder = new ComplexQueryBuilder<BrokerAccountFundsTransfer>()
                .AddJoins(GetFullHierarchyColumns)
                .AddPagination(filter, transfer => transfer.Date, isDescending: true);

            ApplyFilters(builder, filter);

            var pagedTransfers = await _transfersRepo.GetPagedAsync(builder.GetQuery());
            return _mapper.Map(pagedTransfers);
        }

        private static ComplexQueryBuilder<BrokerAccountFundsTransfer> ApplyFilters(
            ComplexQueryBuilder<BrokerAccountFundsTransfer> builder,
            BrokerAccountFundsTransferFilterDto filter)
        {
            if (filter.BrokerAccountId.HasValue && filter.BrokerAccountId.Value != Guid.Empty)
            {
                builder.AddFilter(transfer => transfer.BrokerAccountId == filter.BrokerAccountId.Value);
            }
            return builder;
        }

        public async Task<(decimal deposited, decimal withdrawn)> GetSumTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId)
        {
            async Task<decimal> GetSum(bool isIncome)
            {
                Expression<Func<BrokerAccountFundsTransfer, bool>> filter = brokerAccountId != null ?
                  (fundTransfer) => isIncome == fundTransfer.Income && DateOnly.FromDateTime(fundTransfer.Date) <= date && fundTransfer.BrokerAccountId == brokerAccountId :
                  (fundTransfer) => isIncome == fundTransfer.Income && DateOnly.FromDateTime(fundTransfer.Date) <= date;

                return await _transfersRepo.GetSumAsync((payment) => payment.Amount, filter);
            }

            var deposited = await GetSum(true);
            var withdrawn = await GetSum(false);

            return (
               deposited,
               withdrawn
            );
        }

        public async Task<BrokerAccountFundsTransferDto> AddAsync(BrokerAccountFundsTransferDto transferDto)
        {
            var transfer = _mapper.Map(transferDto);
            await _transfersRepo.AddAsync(transfer);

            await UpdateLinkedAccountsBalance(transferDto.AccountId, transferDto.BrokerAccountId, 
                transferDto.Amount * (transferDto.Income ? 1: -1));

            await _db.CommitAsync();
            
            var storedRecord = await _transfersRepo.GetByIdAsync(transfer.Id, GetFullHierarchyColumns);
            return _mapper.Map(storedRecord);
        }

        public async Task UpdateAsync(BrokerAccountFundsTransferDto transferDto)
        {
            var storedTransfer = await _transfersRepo.GetByIdAsync(transferDto.Id);

            var transfer = _mapper.Map(transferDto);
            _transfersRepo.Update(transfer);

            var amountBefore = storedTransfer.Amount * (storedTransfer.Income ? 1 : -1);
            var amountNow = transferDto.Amount * (transferDto.Income ? 1 : -1);

            var diff = (amountBefore - amountNow) * -1;
            await UpdateLinkedAccountsBalance(transferDto.AccountId, transferDto.BrokerAccountId, diff);

            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var transfer = await _transfersRepo.GetByIdAsync(id);

            await _transfersRepo.DeleteAsync(id);

            await UpdateLinkedAccountsBalance(transfer.AccountId, transfer.BrokerAccountId,
                transfer.Amount * (transfer.Income ? -1 : 1));

            await _db.CommitAsync();
        }

        public async Task UpdateLinkedAccountsBalance(Guid accountId, Guid brokerAccountId, decimal amount)
        {
            var brokerAccount = await _brokerAccountRepo.GetByIdAsync(brokerAccountId);
            if (brokerAccount == null)
            {
                throw new ArgumentException(nameof(brokerAccountId));
            }

            var account = await _accountRepo.GetByIdAsync(accountId);

            if (account == null)
            {
                throw new ArgumentException(nameof(accountId));
            }

            brokerAccount.MainCurrencyAmount += amount;
            await _brokerAccountService.UpdateAsync(_mapper.Map(brokerAccount));
            account.Balance += -1 * amount;
            await _accountService.UpdateAsync(_mapper.Map(account));
        }

        private IQueryable<BrokerAccountFundsTransfer> GetFullHierarchyColumns(IQueryable<BrokerAccountFundsTransfer> query)
        {
            return query
                .Include(transfer => transfer.Account.Currency)
                .Include(transfer => transfer.Account.AccountType)
                .Include(transfer => transfer.Account.Bank)
                .Include(transfer => transfer.BrokerAccount.Type)
                .Include(transfer => transfer.BrokerAccount.Currency)
                .Include(transfer => transfer.BrokerAccount.Broker)
                .Include(transfer => transfer.BrokerAccount.Bank);
        }
    }
}
