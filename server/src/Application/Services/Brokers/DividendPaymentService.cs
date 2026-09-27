using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Common;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Mappings;
using Audex.Application.Queries.Brokers;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Securities;
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
    public class DividendPaymentService : IDividendPaymentService
    {
        private readonly IUnitOfWork _db;

        private readonly IRepository<DividendPayment> _dividendPaymentRepo;
        private readonly IRepository<BrokerAccount> _brokerAccountRepo;
        private readonly IRepository<Dividend> _dividendRepo;
        private readonly ApplicationMapper _mapper;

        public DividendPaymentService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _dividendPaymentRepo = uow.CreateRepository<DividendPayment>();
            _brokerAccountRepo = uow.CreateRepository<BrokerAccount>();
            _dividendRepo = uow.CreateRepository<Dividend>();
        }

        public async Task<PagedResult<DividendPaymentDto>> GetAllAsync(DividendPaymentFilterDto filter)
        {
            var queryBuilder = new ComplexQueryBuilder<DividendPayment>()
                .AddPagination(filter, dividendPayment => dividendPayment.ReceivedAt, true)
                .AddJoins(DividendPaymentQuery.GetFullHierarchyColumns);

            if (filter.BrokerAccountId.HasValue)
            {
                queryBuilder.AddFilter(GetBaseFilter(filter.BrokerAccountId.Value));
            }

            var pagedDividends = await _dividendPaymentRepo.GetPagedAsync(queryBuilder.GetQuery());
            return _mapper.Map(pagedDividends);
        }

        public async Task<decimal> GetSumTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId)
        {
            Expression<Func<DividendPayment, bool>> filter = brokerAccountId != null ?
                (dividendPayment) => dividendPayment.ReceivedAt <= date && dividendPayment.BrokerAccountId == brokerAccountId :
                (dividendPayment) => dividendPayment.ReceivedAt <= date;

            return await _dividendPaymentRepo.GetSumAsync((payment) => payment.SecuritiesQuantity * payment.Dividend.Amount - payment.Tax, filter);
        }

        private Expression<Func<DividendPayment, bool>> GetBaseFilter(Guid brokerAccountId)
        {
            return brokerAccountSecurity => brokerAccountSecurity.BrokerAccountId == brokerAccountId;
        }

        public async Task<decimal> GetEarningsAsync()
        {
            return await _dividendPaymentRepo
                .GetSumAsync(EarningAggregationExpression);
        }

        public async Task<decimal> GetEarningsByBrokerAccountAsync(Guid brokerAccountId)
        {
            return await _dividendPaymentRepo
                .GetSumAsync(EarningAggregationExpression, dividendPayment => dividendPayment.BrokerAccountId == brokerAccountId);
        }

        private static Expression<Func<DividendPayment, decimal>> EarningAggregationExpression =>
            dividendPayment => dividendPayment.SecuritiesQuantity * dividendPayment.Dividend.Amount - dividendPayment.Tax;

        public async Task<Guid> AddAsync(DividendPaymentDto dividendPaymentDto)
        {
            var dividendPayment = _mapper.Map(dividendPaymentDto);
            dividendPayment.Id = Guid.NewGuid();
            await _dividendPaymentRepo.AddAsync(dividendPayment);

            var dividend = await _dividendRepo.GetByIdAsync(dividendPaymentDto.DividendId);
            await ActualizeBrokerAccountBalance(dividendPayment.BrokerAccountId,
                CalculateDividendPaymentAmount(dividend, dividendPayment.SecuritiesQuantity,
                    dividendPayment.Tax));
            await _db.CommitAsync();
            return dividendPayment.Id;
        }

        public async Task UpdateAsync(DividendPaymentDto dividendPaymentDto)
        {
            var dividendPayment = _mapper.Map(dividendPaymentDto);

            var existingDividend = await _dividendPaymentRepo.GetByIdAsync(dividendPaymentDto.Id, DividendPaymentQuery.GetFullHierarchyColumns);
            var existingDividendAmount = CalculateDividendPaymentAmount(existingDividend.Dividend, existingDividend.SecuritiesQuantity,
                existingDividend.Tax);

            var actualDividend = dividendPaymentDto.DividendId != existingDividend.DividendId ? 
                await _dividendRepo.GetByIdAsync(dividendPaymentDto.DividendId) : 
                existingDividend.Dividend;
            var actualDividendAmount = CalculateDividendPaymentAmount(actualDividend, dividendPaymentDto.SecuritiesQuantity,
                dividendPaymentDto.Tax);

            if (existingDividendAmount != actualDividendAmount)
            {
                await ActualizeBrokerAccountBalance(dividendPaymentDto.BrokerAccountId,
                    actualDividendAmount - existingDividendAmount);
            }

            _dividendPaymentRepo.Update(dividendPayment);
            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            await _dividendPaymentRepo.DeleteAsync(id);

            var dividendPayment = await _dividendPaymentRepo.GetByIdAsync(id, DividendPaymentQuery.GetFullHierarchyColumns);
            var diff = CalculateDividendPaymentAmount(dividendPayment.Dividend, dividendPayment.SecuritiesQuantity, 
                dividendPayment.Tax);
            await ActualizeBrokerAccountBalance(dividendPayment.BrokerAccountId, -1 * diff);

            await _db.CommitAsync();
        }

        public async Task ActualizeBrokerAccountBalance(Guid brokerAccountId, decimal diff)
        {
            var brokerAccount = await _brokerAccountRepo.GetByIdAsync(brokerAccountId, disableTracking: false);
            brokerAccount.MainCurrencyAmount += diff;
            _brokerAccountRepo.Update(brokerAccount);
        }

        private decimal CalculateDividendPaymentAmount(Dividend dividend, int securitiesQuantity, decimal tax)
        {
            return dividend.Amount * securitiesQuantity - tax;
        }
    }
}