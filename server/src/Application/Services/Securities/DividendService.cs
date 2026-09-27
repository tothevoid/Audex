using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Debts;
using Audex.Infrastructure.Entities.Deposits;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

using Audex.Shared.Common;

namespace Audex.Application.Services.Securities
{
    public class DividendService : IDividendService
    {
        private readonly IUnitOfWork _db;

        private readonly IRepository<Dividend> _dividendRepo;
        private readonly ApplicationMapper _mapper;
        public DividendService(IUnitOfWork uow, ApplicationMapper mapper)
        {
            _db = uow;
            _mapper = mapper;
            _dividendRepo = uow.CreateRepository<Dividend>();
        }

        public async Task<PagedResult<DividendDto>> GetAllAsync(DividendFilterDto filter)
        {
            var query = new ComplexQueryBuilder<Dividend>()
                .AddPagination(filter, dividend => dividend.SnapshotDate, true)
                .AddFilter(dividend => dividend.SecurityId == filter.SecurityId)
                .AddJoins(GetFullHierarchyColumns)
                .GetQuery();

            var pagedDividends = await _dividendRepo.GetPagedAsync(query);
            return _mapper.Map(pagedDividends);
        }

        private Expression<Func<Dividend, bool>> GetBaseFilter(Guid securityId)
        {
            return brokerAccountSecurity => brokerAccountSecurity.SecurityId == securityId;
        }

        public async Task<IEnumerable<DividendDto>> GetAvailableAsync(Guid brokerAccountId)
        {
            var securities = await _dividendRepo
                .GetAllAsync((dividend) => dividend.DividendPayments.All(payment => 
                       !dividend.DividendPayments.Any(p => p.BrokerAccountId == brokerAccountId) &&
                        dividend.Security.BrokerAccountSecurities.Any(s => s.BrokerAccountId == brokerAccountId)
                    ),
                    include: GetFullHierarchyColumns);
            return _mapper.Map(securities);
        }

        public async Task UpdateAsync(DividendDto securityTypeDto)
        {
            var dividend = _mapper.Map(securityTypeDto);
            _dividendRepo.Update(dividend);
            await _db.CommitAsync();
        }

        public async Task<Guid> AddAsync(DividendDto securityDto)
        {
            var dividend = _mapper.Map(securityDto);
            dividend.Id = Guid.NewGuid();
            await _dividendRepo.AddAsync(dividend);
            await _db.CommitAsync();
            return dividend.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _dividendRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        private IQueryable<Dividend> GetFullHierarchyColumns(IQueryable<Dividend> dividendQuery)
        {
            return dividendQuery.Include(dividend => dividend.Security.Currency);
        }
    }
}
