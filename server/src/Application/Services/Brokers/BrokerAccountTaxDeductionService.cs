using Audex.Application.Interfaces.Brokers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Interfaces.Database;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Audex.Infrastructure.Queries;

namespace Audex.Application.Services.Brokers
{
    public class BrokerAccountTaxDeductionService : IBrokerAccountTaxDeductionService
    {
        private readonly IRepository<BrokerAccountTaxDeduction> _brokerAccountTaxDeductionRepo;
        private readonly IUnitOfWork _db;
        private readonly ApplicationMapper _mapper;

        public BrokerAccountTaxDeductionService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _brokerAccountTaxDeductionRepo = uow.CreateRepository<BrokerAccountTaxDeduction>();
        }

        public async Task<IEnumerable<BrokerAccountTaxDeductionDto>> GetAllAsync(Guid? brokerAccountId = null)
        {
            var queryBuilder = new ComplexQueryBuilder<BrokerAccountTaxDeduction>();

            if (brokerAccountId.HasValue && brokerAccountId.Value != Guid.Empty)
            {
                queryBuilder.AddFilter(taxDeduction => taxDeduction.BrokerAccountId == brokerAccountId.Value);
            }

            queryBuilder
                .AddJoins(GetFullHierarchyColumns)
                .AddOrder(taxDeduction => taxDeduction.DateApplied, isDescending: true);

            var entities = await _brokerAccountTaxDeductionRepo.GetAllAsync(queryBuilder.GetQuery());
            return _mapper.Map(entities);
        }

        public async Task<IEnumerable<BrokerAccountTaxDeductionDto>> GetTillDateAsync(DateOnly date, Guid? brokerAccountId = null)
        {
            var endDateTime = date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            Expression<Func<BrokerAccountTaxDeduction, bool>> filter = brokerAccountId.HasValue
                ? taxDeduction => taxDeduction.BrokerAccountId == brokerAccountId.Value && taxDeduction.DateApplied <= endDateTime
                : taxDeduction => taxDeduction.DateApplied <= endDateTime;

            var taxDeductions = await _brokerAccountTaxDeductionRepo.GetAllAsync(filter, disableTracking: true);
            return _mapper.Map(taxDeductions);
        }

        public async Task<decimal> GetSumTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId)
        {
            Expression<Func<BrokerAccountTaxDeduction, bool>> filter = brokerAccountId != null ?
                (taxDeduction) => DateOnly.FromDateTime(taxDeduction.DateApplied) <= date && taxDeduction.BrokerAccountId == brokerAccountId :
                (taxDeduction) => DateOnly.FromDateTime(taxDeduction.DateApplied) <= date;

            return await _brokerAccountTaxDeductionRepo.GetSumAsync((taxDeduction) => taxDeduction.Amount, filter);
        }

        public async Task<decimal> GetAmountByBrokerAccountAsync(Guid brokerAccountId)
        {
            return await _brokerAccountTaxDeductionRepo.GetSumAsync(
                projection: (taxDeduction) => taxDeduction.Amount,
                filter: (taxDeduction) => taxDeduction.BrokerAccountId == brokerAccountId);
        }

        public async Task<Guid> AddAsync(BrokerAccountTaxDeductionDto dto)
        {
            var entity = _mapper.Map(dto);
            entity.Id = Guid.NewGuid();
            await _brokerAccountTaxDeductionRepo.AddAsync(entity);
            await _db.CommitAsync();
            return entity.Id;
        }

        public async Task UpdateAsync(BrokerAccountTaxDeductionDto dto)
        {
            var entity = _mapper.Map(dto);
            _brokerAccountTaxDeductionRepo.Update(entity);
            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            await _brokerAccountTaxDeductionRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        private IQueryable<BrokerAccountTaxDeduction> GetFullHierarchyColumns(IQueryable<BrokerAccountTaxDeduction> taxDeductionQuery)
        {
            return taxDeductionQuery
                .Include(taxDeduction => taxDeduction.BrokerAccount.Type)
                .Include(taxDeduction => taxDeduction.BrokerAccount.Currency)
                .Include(taxDeduction => taxDeduction.BrokerAccount.Broker)
                .Include(taxDeduction => taxDeduction.BrokerAccount.Bank);
        }
    }
}