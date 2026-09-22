using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Application.Queries.Brokers;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;

namespace Audex.Application.Services.Securities
{
    public class SecurityTransactionService : ISecurityTransactionService
    {
        private readonly IUnitOfWork _db;

        private readonly IRepository<SecurityTransaction> _securityTransactionRepo;
        private readonly IRepository<BrokerAccountSecurity> _brokerAccountSecurityRepo;
        // TOOD: Change repo to service
        private readonly IRepository<BrokerAccount> _brokerAccountRepo;
        private readonly IRepository<DividendPayment> _dividendPaymentRepo;
        private readonly IBrokerAccountSecurityService _brokerAccountSecurityService;
        private readonly ApplicationMapper _mapper;

        public SecurityTransactionService(IUnitOfWork uow, ApplicationMapper mapper, IBrokerAccountSecurityService brokerAccountSecurityService)
        {
            _db = uow;
            _mapper = mapper;

            _brokerAccountSecurityService = brokerAccountSecurityService;

            _securityTransactionRepo = uow.CreateRepository<SecurityTransaction>();
            _brokerAccountSecurityRepo = uow.CreateRepository<BrokerAccountSecurity>();
            _brokerAccountRepo = uow.CreateRepository<BrokerAccount>();
            _dividendPaymentRepo = uow.CreateRepository<DividendPayment>();
        }

        public async Task<IEnumerable<SecurityTransactionDto>> GetAllAsync(Guid? brokerAccountId,
            int recordsQuantity, int pageIndex)
        {
            var query = new ComplexQueryBuilder<SecurityTransaction>()
                .AddJoins(GetFullHierarchyColumns)
                .AddPagination(pageIndex, recordsQuantity,
                    securityTransaction => securityTransaction.Date,
                    true);

            if (brokerAccountId != null)
            {
                query.AddFilter(GetBaseFilter((Guid) brokerAccountId));
            }

            var brokerAccountSecurities = await _securityTransactionRepo
                .GetAllAsync(query.GetQuery());
            return _mapper.Map(brokerAccountSecurities);
        }

        public async Task<Dictionary<string, SecurityTransactionsSummaryDto>> GetSummaryTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId)
        {
            Expression<Func<SecurityTransaction, bool>> filter = brokerAccountId != null ?
                (transaction) => DateOnly.FromDateTime(transaction.Date) <= date && transaction.BrokerAccountId == brokerAccountId :
                (transaction) => DateOnly.FromDateTime(transaction.Date) <= date;

            var result = await _securityTransactionRepo.GroupAsync(
                (transaction) => transaction.Security.Ticker, 
                (group) =>
                    new
                    {
                        Ticker = group.Key,
                        Stats = new
                        {
                            ActualQuantity = group.Sum(x => x.IsSell ? -1 * x.Quantity : x.Quantity),
                            PurchasePriceSum = group.Sum(x => x.IsSell ? 0: x.Price * x.Quantity + x.Tax + x.BrokerCommission + x.StockExchangeCommission),
                            SellPriceSum = group.Sum(x => !x.IsSell ? 0 : x.Price * x.Quantity - x.Tax - x.BrokerCommission - x.StockExchangeCommission),
                        }
                    }
                ,
                filter);

            return result.ToDictionary(
                (key) => key.Ticker,
                (value) => new SecurityTransactionsSummaryDto
                {
                    ActualQuantity = value.Stats.ActualQuantity,
                    PurchasePriceSum = value.Stats.PurchasePriceSum,
                    SellPriceSum = value.Stats.SellPriceSum
                });
        }

        public async Task<IEnumerable<SecurityTransactionsHistoryDto>> GetTransactionsHistoryAsync(Guid securityId)
        {
            var complexQuery = new ComplexQueryBuilder<SecurityTransaction>()
                .AddFilter(securityTransaction => securityTransaction.SecurityId == securityId)
                .AddJoins(GetFullHierarchyColumns)
                .AddOrder(securityTransaction => securityTransaction.Date)
                .GetQuery();

            var transactions = await _securityTransactionRepo
                .GetAllAsync(complexQuery);

            var dividendsPayments = (await _dividendPaymentRepo
                .GetAllAsync(dividendPayment => dividendPayment.Dividend.SecurityId == securityId, DividendPaymentQuery.GetFullHierarchyColumns))
                .OrderBy(dividendPayment => dividendPayment.ReceivedAt)
                .ToArray();

            var convertedTransactions = new List<SecurityTransactionsHistoryDto>();

            //TODO: include sold securities
            foreach (var transaction in transactions)
            {
                var date = DateOnly.FromDateTime(transaction.Date);

                var paymentsSum = dividendsPayments
                    .Where(payment => payment.Dividend.SnapshotDate > date)
                    .Sum(payment => payment.Dividend.Amount - payment.Tax / payment.SecuritiesQuantity);

                convertedTransactions.Add(new SecurityTransactionsHistoryDto()
                {
                    Date = transaction.Date,
                    ValueWithPayments = transaction.Price - paymentsSum,
                    ValueWithoutPayments = transaction.Price,
                    Volume = transaction.Quantity
                });
            }

            return convertedTransactions;
        }

        public async Task<PaginationConfigDto> GetPaginationAsync(Guid brokerAccountId)
        {
            var filter = GetBaseFilter(brokerAccountId);
            return await GetFilteredPagination(filter);
        }

        public async Task<PaginationConfigDto> GetPaginationAsync()
        {
            return await GetFilteredPagination();
        }

        public async Task<(decimal BrokerCommissions, decimal StockExchangeCommissions, decimal TransactionTaxes)> GetCommissionsAndTaxesAsync(Guid? brokerAccountId = null)
        {
            Expression<Func<SecurityTransaction, bool>> filter = brokerAccountId.HasValue
                ? transaction => transaction.BrokerAccountId == brokerAccountId.Value
                : null;

            var transactions = await _securityTransactionRepo.GetAllAsync(filter: filter, disableTracking: true);

            decimal brokerCommissions = 0;
            decimal stockExchangeCommissions = 0;
            decimal transactionTaxes = 0;

            foreach (var transaction in transactions)
            {
                brokerCommissions += transaction.BrokerCommission;
                stockExchangeCommissions += transaction.StockExchangeCommission;
                transactionTaxes += transaction.Tax;
            }

            return (brokerCommissions, stockExchangeCommissions, transactionTaxes);
        }

        private async Task<PaginationConfigDto> GetFilteredPagination(Expression<Func<SecurityTransaction, bool>> filter = null)
        {
            int pageSize = 10;
            var recordsQuantity = await _securityTransactionRepo.GetCountAsync(filter);

            return new PaginationConfigDto()
            {
                PageSize = pageSize,
                RecordsQuantity = recordsQuantity
            };
        }

        private Expression<Func<SecurityTransaction, bool>> GetBaseFilter(Guid brokerAccountId)
        {
            return transaction => transaction.BrokerAccountId == brokerAccountId;
        }

        public async Task<Guid> AddAsync(SecurityTransactionDto securityDto)
        {
            var securityTransaction = _mapper.Map(securityDto);
            securityTransaction.Id = Guid.NewGuid();
            await HandleAddedTransaction(securityDto);
            await _securityTransactionRepo.AddAsync(securityTransaction);
            await _db.CommitAsync();
            return securityTransaction.Id;
        }

        public async Task UpdateAsync(SecurityTransactionDto securityDto)
        {
            await HandleModifiedTransaction(securityDto);

            var existing = await _securityTransactionRepo.GetByIdAsync(securityDto.Id);
            if (existing != null)
            {
                existing.Price = securityDto.Price;
                existing.Quantity = securityDto.Quantity;
                existing.BrokerCommission = securityDto.BrokerCommission;
                existing.StockExchangeCommission = securityDto.StockExchangeCommission;
                existing.Tax = securityDto.Tax;
                existing.Date = securityDto.Date;
                existing.IsSell = securityDto.IsSell;
                existing.BrokerAccountId = securityDto.BrokerAccountId;
                existing.SecurityId = securityDto.SecurityId;

                _securityTransactionRepo.Update(existing);
            }
            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            await HandleDeletedTransaction(id);
            await _securityTransactionRepo.DeleteAsync(id);

            await _db.CommitAsync();
        }

        private async Task<BrokerAccountSecurity> FindExistingBrokerAccountSecurity(SecurityTransactionDto securityTransaction)
        {
            return await _brokerAccountSecurityRepo.FindAsync(brokerAccountSecurity =>
                brokerAccountSecurity.BrokerAccountId == securityTransaction.BrokerAccountId &&
                brokerAccountSecurity.SecurityId == securityTransaction.SecurityId,
                disableTracking: false);
        }

        private async Task GenerateBrokerAccountSecurity(SecurityTransactionDto securityTransaction)
        {
            var price = securityTransaction.GetTotalPrice;
            var brokerAccountSecurity = new BrokerAccountSecurity()
            {
                SecurityId = securityTransaction.SecurityId,
                BrokerAccountId = securityTransaction.BrokerAccountId,
                Price = price,
                Quantity = securityTransaction.Quantity
            };

            await _brokerAccountSecurityRepo.AddAsync(brokerAccountSecurity);
            await _db.CommitAsync();
            await ActualizeBrokerAccountCurrencyValue(brokerAccountSecurity.BrokerAccountId, -1 * price);
        }

        private async Task HandleAddedTransaction(SecurityTransactionDto securityTransaction, BrokerAccountSecurity brokerAccountSecurity = null)
        {
            var modifiingBrokerAccountSecurity = await FindExistingBrokerAccountSecurity(securityTransaction);


            modifiingBrokerAccountSecurity = brokerAccountSecurity != null && modifiingBrokerAccountSecurity?.Id == brokerAccountSecurity.Id ?
                brokerAccountSecurity :
                modifiingBrokerAccountSecurity;

            if (securityTransaction.IsSell)
            {
                await ApplyAddedSellTransaction(securityTransaction, modifiingBrokerAccountSecurity);
            }
            else
            {
                await ApplyAddedBuyTransaction(securityTransaction, modifiingBrokerAccountSecurity);
            }
        }

        private async Task ApplyAddedBuyTransaction(SecurityTransactionDto securityTransaction, BrokerAccountSecurity brokerAccountSecurity)
        {
            if (brokerAccountSecurity != null)
            {
                var totalPrice = securityTransaction.GetTotalPrice;
                brokerAccountSecurity.Quantity += securityTransaction.Quantity;
                brokerAccountSecurity.Price += totalPrice;
                await UpdateBrokerAccountSecurity(brokerAccountSecurity);

                await ActualizeBrokerAccountCurrencyValue(brokerAccountSecurity.BrokerAccountId, -1 * totalPrice);
            }
            else
            {
                await GenerateBrokerAccountSecurity(securityTransaction);
            }

        }

        private async Task ApplyAddedSellTransaction(SecurityTransactionDto securityTransaction, BrokerAccountSecurity brokerAccountSecurity)
        {
            if (brokerAccountSecurity == null)
            {
                return;
            }

            var totalPrice = securityTransaction.GetTotalPrice;

            brokerAccountSecurity.SoldPrice += totalPrice;
            brokerAccountSecurity.SoldQuantity += securityTransaction.Quantity;

            await UpdateBrokerAccountSecurity(brokerAccountSecurity);
            await ActualizeBrokerAccountCurrencyValue(brokerAccountSecurity.BrokerAccountId, totalPrice);
        }

        private async Task HandleModifiedTransaction(SecurityTransactionDto modifiedSecurityTransaction)
        {
            var brokerAccountSecurity = await FindExistingBrokerAccountSecurity(modifiedSecurityTransaction);
            if (brokerAccountSecurity != null)
            {
                await ApplyTransactionChanges(brokerAccountSecurity, modifiedSecurityTransaction);
            }
            else
            {
                await GenerateBrokerAccountSecurity(modifiedSecurityTransaction);
            }
        }

        private async Task ApplyTransactionChanges(BrokerAccountSecurity brokerAccountSecurity,
            SecurityTransactionDto modifiedSecurityTransaction)
        {
            var committedSecurityTransaction = await _securityTransactionRepo.GetByIdAsync(modifiedSecurityTransaction.Id, disableTracking: true);
            var committedSecurityTransactionDto = _mapper.Map(committedSecurityTransaction);

            if (committedSecurityTransactionDto.BrokerAccountId != modifiedSecurityTransaction.BrokerAccountId ||
                committedSecurityTransactionDto.IsSell != modifiedSecurityTransaction.IsSell)
            {
                await HandleChangedBrokerAccount(committedSecurityTransactionDto, modifiedSecurityTransaction);
                return;
            }
            
            var quantityDiff = modifiedSecurityTransaction.Quantity - committedSecurityTransaction.Quantity;

            var totalCommittedPrice = committedSecurityTransactionDto.GetTotalPrice;
            var totalModifiedPrice = modifiedSecurityTransaction.GetTotalPrice;

            if (quantityDiff == 0 && totalCommittedPrice == totalModifiedPrice)
            {
                return;
            }

            if (quantityDiff != 0)
            {
                var diff = modifiedSecurityTransaction.Quantity - committedSecurityTransactionDto.Quantity;

                if (modifiedSecurityTransaction.IsSell)
                {
                    brokerAccountSecurity.SoldQuantity += diff;
                }
                else
                {
                    brokerAccountSecurity.Quantity += diff;
                }
            }

            var priceDiff = totalModifiedPrice - totalCommittedPrice;

            if (modifiedSecurityTransaction.IsSell)
            {
                brokerAccountSecurity.SoldPrice += priceDiff;
            }
            else
            {
                brokerAccountSecurity.Price += priceDiff;
            }

            _brokerAccountSecurityRepo.Update(brokerAccountSecurity);

            await ActualizeBrokerAccountCurrencyValue(brokerAccountSecurity.BrokerAccountId, priceDiff * -1);
        }

        private async Task<bool> HandleChangedBrokerAccount(SecurityTransactionDto committedTransaction, 
            SecurityTransactionDto modifiedTransaction)
        {
            var securityTransaction = await _securityTransactionRepo.GetByIdAsync(committedTransaction.Id);
            var securityTransactionDto = _mapper.Map(securityTransaction);
            var brokerAccountSecurity = await FindExistingBrokerAccountSecurity(securityTransactionDto);

            await HandleDeletedTransaction(committedTransaction.Id, brokerAccountSecurity);
            await HandleAddedTransaction(modifiedTransaction, brokerAccountSecurity);

            return true;
        }

        private async Task ActualizeBrokerAccountCurrencyValue(Guid brokerAccountId, decimal currencyDiff)
        {
            var brokerAccount = await _brokerAccountRepo.GetByIdAsync(brokerAccountId, disableTracking: false);
            brokerAccount.MainCurrencyAmount += currencyDiff;
            _brokerAccountRepo.Update(brokerAccount);
            await _db.CommitAsync();
        }

        private async Task HandleDeletedTransaction(Guid transactionId, BrokerAccountSecurity brokerAccountSecurity = null)
        {
            var securityTransaction = await _securityTransactionRepo.GetByIdAsync(transactionId);
            var securityTransactionDto = _mapper.Map(securityTransaction);

            if (brokerAccountSecurity == null)
            {
                brokerAccountSecurity = await FindExistingBrokerAccountSecurity(securityTransactionDto);
            }

            if (securityTransaction.IsSell)
            {
                await HandleDeletedSellTransaction(securityTransactionDto, brokerAccountSecurity);
            }
            else
            {
                await HandleDeletedBuyTransaction(securityTransactionDto, brokerAccountSecurity);
            }
        }
        
        private async Task HandleDeletedBuyTransaction(SecurityTransactionDto transaction, BrokerAccountSecurity brokerAccountSecurity)
        {
            if (brokerAccountSecurity == null)
            {
                return;
            }

            var price = transaction.GetTotalPrice;

            if (brokerAccountSecurity.Quantity == transaction.Quantity && brokerAccountSecurity.SoldQuantity == 0)
            {
                await _brokerAccountSecurityService.DeleteAsync(brokerAccountSecurity.Id);
            }
            else
            {
                brokerAccountSecurity.Quantity -= transaction.Quantity;
                brokerAccountSecurity.Price -= price;

                await UpdateBrokerAccountSecurity(brokerAccountSecurity);
            }
           
            await ActualizeBrokerAccountCurrencyValue(brokerAccountSecurity.BrokerAccountId, price);
        }

        private async Task HandleDeletedSellTransaction(SecurityTransactionDto transaction, BrokerAccountSecurity brokerAccountSecurity)
        {
            var price = transaction.GetTotalPrice;

            if (brokerAccountSecurity == null)
            {
                await GenerateBrokerAccountSecurity(transaction);
            }
            else
            {
                brokerAccountSecurity.SoldPrice -= price;
                brokerAccountSecurity.SoldQuantity -= transaction.Quantity;

                await UpdateBrokerAccountSecurity(brokerAccountSecurity);
            }
           
            await ActualizeBrokerAccountCurrencyValue(transaction.BrokerAccountId, -1 * price);
        }

        private async Task UpdateBrokerAccountSecurity(BrokerAccountSecurity brokerAccountSecurity)
        {
            _brokerAccountSecurityRepo.Update(brokerAccountSecurity);
            await _db.CommitAsync();
        }

        private IQueryable<SecurityTransaction> GetFullHierarchyColumns(
            IQueryable<SecurityTransaction> securityTransactionQuery)
        {
            return securityTransactionQuery
                .Include(security => security.BrokerAccount.Type)
                .Include(security => security.BrokerAccount.Currency)
                .Include(security => security.BrokerAccount.Broker)
                .Include(security => security.BrokerAccount.Bank)
                .Include(security => security.Security.Type)
                .Include(security => security.Security.Currency);
        }
    }
}
