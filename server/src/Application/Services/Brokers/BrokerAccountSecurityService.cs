using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Application.Services.Securities;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Interfaces.Messages;
using Audex.Infrastructure.Queries;
using Audex.Shared.Constants;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.Json;
using System.Threading.Tasks;

namespace Audex.Application.Services.Brokers
{
    public class BrokerAccountSecurityService : IBrokerAccountSecurityService
    {
        private readonly IUnitOfWork _db;
        private readonly ApplicationMapper _mapper;

        private readonly IRepository<BrokerAccountSecurity> _brokerAccountSecurityRepo;
        private readonly IRepository<Security> _securityRepo;
        private readonly ISecurityService _securityService;
        private readonly IStockConnector _stockConnector;
        private readonly IPullQuotationsService _pullQuotationsService;

        private static readonly Expression<Func<BrokerAccountSecurity, object>> DefaultOrder = 
            (BrokerAccountSecurity brokerAccountSecurity) => brokerAccountSecurity.Security.Ticker;

        private IServerNotifier _serverNotifier;

        public BrokerAccountSecurityService(IUnitOfWork uow, ApplicationMapper mapper, 
            IStockConnector stockConnector, IServerNotifier serverNotifier,
            ISecurityService securityService,
            IPullQuotationsService pullQuotationsService)
        {
            _db = uow;
            _mapper = mapper;
            _brokerAccountSecurityRepo = uow.CreateRepository<BrokerAccountSecurity>();
            _securityRepo = uow.CreateRepository<Security>();
            _securityService = securityService;
            _serverNotifier = serverNotifier;
            _pullQuotationsService = pullQuotationsService;

            _stockConnector = stockConnector;
        }

        public async Task<IEnumerable<BrokerAccountSecurityDto>> GetAllAsync(bool unionSecurities = false)
        {
            var complexQuery = new ComplexQueryBuilder<BrokerAccountSecurity>()
                .AddJoins(GetFullHierarchyColumns)
                .AddOrder(DefaultOrder)
                .GetQuery();

            var brokerAccountSecurities = await _brokerAccountSecurityRepo
                .GetAllAsync(complexQuery);

            var mappedDtos = _mapper.Map(brokerAccountSecurities).ToList();

            if (!unionSecurities)
            {
                return mappedDtos;
            }

            var handledBrokerAccountSecurities = new Dictionary<Guid, BrokerAccountSecurityDto>();

            foreach (var brokerAccountSecurity in mappedDtos)
            {
                var securityId = brokerAccountSecurity.SecurityId;

                if (handledBrokerAccountSecurities.ContainsKey(securityId))
                {
                    var existingBrokerAccountSecurity = handledBrokerAccountSecurities[securityId];
                    existingBrokerAccountSecurity.Quantity += brokerAccountSecurity.Quantity;
                    existingBrokerAccountSecurity.Price += brokerAccountSecurity.Price;
                    existingBrokerAccountSecurity.SoldPrice += brokerAccountSecurity.SoldPrice;
                    existingBrokerAccountSecurity.SoldQuantity += brokerAccountSecurity.SoldQuantity;
                }
                else
                {
                    handledBrokerAccountSecurities.Add(securityId, brokerAccountSecurity);
                }
            }

            return handledBrokerAccountSecurities.Values;
        }

        public async Task<IEnumerable<BrokerAccountSecurityDto>> GetByBrokerAccountAsync(Guid brokerAccountId)
        {
            var complexQuery = new ComplexQueryBuilder<BrokerAccountSecurity>()
                .AddFilter(GetBaseFilter(brokerAccountId))
                .AddJoins(GetFullHierarchyColumns)
                .AddOrder(DefaultOrder)
                .GetQuery();

            var brokerAccountSecurities = await _brokerAccountSecurityRepo
                .GetAllAsync(complexQuery);
            return _mapper.Map(brokerAccountSecurities);
        }

        public async Task PullQuotationsAsync()
        {
            var securities = (await _securityService.GetAllAsync()).ToList();

            if (!securities.Any())
            {
                return;
            }

            await PullQuotations(securities);
        }

        public async Task PullQuotationsByBrokerAccountAsync(Guid brokerAccountId)
        {
            //TODO: limit data to only ticker
            var brokerAccountSecurities = await _brokerAccountSecurityRepo
                .GetAllAsync((brokerAccountSecurity) => brokerAccountSecurity.BrokerAccountId == brokerAccountId,
                    (query) => query.Include((brokerAccount) => brokerAccount.Security));

            var mappedSecurities =  _mapper.Map(brokerAccountSecurities);

            await PullQuotations(mappedSecurities.Select(brokerAccountSecurity => brokerAccountSecurity.Security).ToList());
        }

        private async Task PullQuotations(IEnumerable<SecurityDto> securities)
        {
            var date = DateTime.UtcNow;
            var tickersValues = (await _stockConnector
                .GetValuesByTickersAsync(securities)).ToList();
                
            var filteredValue = tickersValues
                .Where(marketValue => (marketValue.LastValue ?? marketValue.MarketPrice) != null)
                .OrderByDescending(marketValue => marketValue.Date)
                .DistinctBy(marketValue => marketValue.Ticker)
                .ToDictionary((marketValue) => marketValue.Ticker, (marketValue) => marketValue);
           
            foreach (var security in securities)
            {
                var row = filteredValue.GetValueOrDefault(security.Ticker);
                if (row == null) continue;

                // TODO: use service instead of repo
                var updatingSecurity = await _securityRepo.GetByIdAsync(security.Id, null, false);
                updatingSecurity.ActualPrice = row.GetLastValue();
                updatingSecurity.PriceFetchedAt = DateTime.UtcNow;
            }

            _pullQuotationsService.UpdatePullDate(date);
            await _db.CommitAsync();
            await _serverNotifier.SendToAllAsync(ServerNotificationEvents.QuotesRecalculated, new QuotesRecalculatedDto { Date = date });
        }

        public async Task<Guid> AddAsync(BrokerAccountSecurityDto brokerAccountSecurityDto)
        {
            var brokerAccountSecurity = _mapper.Map(brokerAccountSecurityDto);
            brokerAccountSecurity.Id = Guid.NewGuid();
            await _brokerAccountSecurityRepo.AddAsync(brokerAccountSecurity);
            await _db.CommitAsync();
            return brokerAccountSecurity.Id;
        }

        public async Task UpdateAsync(BrokerAccountSecurityDto brokerAccountSecurityDto)
        {
            var brokerAccountSecurity = _mapper.Map(brokerAccountSecurityDto);
            _brokerAccountSecurityRepo.Update(brokerAccountSecurity);
            await _db.CommitAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            await _brokerAccountSecurityRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        public async Task<decimal> GetInitialSecuritiesValueAsync(Guid brokerAccountId)
        {
            var securities = await GetByBrokerAccountAsync(brokerAccountId);
            return securities.Sum(accountSecurity => accountSecurity.Price);
        }

        public async Task<decimal> GetActualSecuritiesValueAsync(Guid brokerAccountId)
        {
            var securities = await GetByBrokerAccountAsync(brokerAccountId);
            return securities.Sum(accountSecurity => (accountSecurity.Quantity - accountSecurity.SoldQuantity) * accountSecurity.Security.ActualPrice);
        }

        public async Task<decimal> GetTotalSoldByBrokerAccountAsync(Guid brokerAccountId)
        {
            var brokerAccountSecurities = await GetByBrokerAccountAsync(brokerAccountId);

            return brokerAccountSecurities.Sum(brokerAccountSecurity => brokerAccountSecurity.SoldPrice);
        }

        private Expression<Func<BrokerAccountSecurity, bool>> GetBaseFilter(Guid brokerAccountId)
        {
            return brokerAccountSecurity => brokerAccountSecurity.BrokerAccountId == brokerAccountId;
        }

        private IQueryable<BrokerAccountSecurity> GetFullHierarchyColumns(IQueryable<BrokerAccountSecurity> brokerAccountSecurityQuery)
        {
            return brokerAccountSecurityQuery
                .Include(brokerAccountSecurity => brokerAccountSecurity.Security.Currency)
                .Include(brokerAccountSecurity => brokerAccountSecurity.Security.Type)
                .Include(brokerAccountSecurity => brokerAccountSecurity.BrokerAccount.Type)
                .Include(brokerAccountSecurity => brokerAccountSecurity.BrokerAccount.Currency)
                .Include(brokerAccountSecurity => brokerAccountSecurity.BrokerAccount.Broker)
                .Include(brokerAccountSecurity => brokerAccountSecurity.BrokerAccount.Bank);
        }
    }
}
