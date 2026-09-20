#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Audex.Application.DTO.FileStorage;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.FileStorage;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Securities
{
    public class SecurityService(
        IUnitOfWork uow,
        ApplicationMapper mapper,
        IStockConnector stockConnector,
        IFileStorageService fileStorageService) : ISecurityService
    {
        private readonly IUnitOfWork _db = uow;

        private readonly IRepository<Security> _securityRepo = uow.CreateRepository<Security>();
        private readonly IRepository<BrokerAccountSecurity> _brokerAccountSecurityRepo = uow.CreateRepository<BrokerAccountSecurity>();
        private readonly IRepository<SecurityTransaction> _securityTransactionsRepo = uow.CreateRepository<SecurityTransaction>();
        private readonly IRepository<DividendPayment> _dividendPaymentRepo = uow.CreateRepository<DividendPayment>();

        private readonly IStockConnector _stockConnector = stockConnector;
        private readonly ApplicationMapper _mapper = mapper;
        private readonly IFileStorageService _fileStorageService = fileStorageService;
        private const string _iconsBucket = "security";

        public async Task<IEnumerable<SecurityDto>> GetAllAsync(bool disableTracking = true)
        {
            var securities = await _securityRepo.GetAllAsync(include: GetFullHierarchyColumns, disableTracking: disableTracking);
            return _mapper.Map(securities);
        }
        public async Task<SecurityDto> FindByTickerAsync(string ticker)
        {
            return (await FindByTickersAsync([ticker])).FirstOrDefault();
        }

        public async Task<SecurityDto?> FindByIsinAsync(string isin)
        {
            if (string.IsNullOrWhiteSpace(isin))
            {
                return null;
            }

            var trimmedIsin = isin.Trim().ToUpper();
            var security = await _securityRepo.FindAsync(
                s => s.Isin != null && s.Isin.ToUpper() == trimmedIsin,
                include: GetFullHierarchyColumns);

            return security != null ? _mapper.Map(security) : null;
        }

        public async Task<MarketSecurityInfoDto?> SearchMarketAsync(string query)
        {
            return await _stockConnector.FindSecurityInfoAsync(query);
        }

        public async Task<IEnumerable<SecurityDto>> FindByTickersAsync(IEnumerable<string> tickers)
        {
            var lowerTickers = tickers.Select(ticker => ticker.ToLower()).ToArray();

            var securities = await _securityRepo
                .GetAllAsync(filter: security => lowerTickers.Contains(security.Ticker.ToLower()), include: GetFullHierarchyColumns);
            return _mapper.Map(securities);
        }

        public async Task<SecurityStatsDto> GetStatsAsync(Guid securityId)
        {
            // TODO: compare performance between db calls and linq calls
            var securityTransactionsPrices = (await _securityTransactionsRepo.GetAllAsync(transaction => transaction.SecurityId == securityId))
               .ToArray();

            if (securityTransactionsPrices.Length == 0)
            {
                return new SecurityStatsDto();
            }

            decimal min = securityTransactionsPrices[0].Price;
            decimal max = securityTransactionsPrices[0].Price;
            decimal pricesSum = 0;
            decimal totalSum = 0;

            foreach (var transaction in securityTransactionsPrices)
            {
                var transactionPrice = transaction.Price;

                if (transactionPrice < min)
                {
                    min = transactionPrice;
                }

                if (transactionPrice > max)
                {
                    max = transactionPrice;
                }

                pricesSum += transactionPrice;
                totalSum += transactionPrice * transaction.Quantity;
            }
        
            var hasOnBrokerAccounts = await _brokerAccountSecurityRepo.GetSumAsync(brokerAccountSecurity => brokerAccountSecurity.Quantity,
                brokerAccountSecurity => brokerAccountSecurity.SecurityId == securityId);

            var dividendsIncome = await _dividendPaymentRepo.GetSumAsync(dividendPayment => dividendPayment.SecuritiesQuantity * dividendPayment.Dividend.Amount - dividendPayment.Tax, 
                dividendPayment => dividendPayment.Dividend.SecurityId == securityId);

            return new SecurityStatsDto
            {
                TransactionsMin = min,
                TransactionsMax = max,
                TransactionsSum = totalSum,
                HasOnBrokerAccounts = (int)hasOnBrokerAccounts,
                //TODO: also calculate weighed mean
                TransactionsAvg = pricesSum / securityTransactionsPrices.Length,
                DividendsIncome = dividendsIncome
            };
        }

        public async Task<SecurityDto> GetByIdAsync(Guid id, bool loadHierarchy = true, bool disableTracking = true)
        {
            var security = await _securityRepo.GetByIdAsync(id, loadHierarchy ? GetFullHierarchyColumns: null, disableTracking);
            var securityDto = _mapper.Map(security);
            return securityDto;
        }

        public async Task<SecurityHistoryDto> GetTickerHistoryAsync(
            string ticker,
            SecurityHistoryPeriod period = SecurityHistoryPeriod.Day1)
        {
            var to = DateOnly.FromDateTime(DateTime.Now);
            var (from, interval) = period switch
            {
                SecurityHistoryPeriod.Day1 => (to.AddDays(-1), 10),
                SecurityHistoryPeriod.Week1 => (to.AddDays(-7), 60),
                SecurityHistoryPeriod.Month1 => (to.AddMonths(-1), 24),
                SecurityHistoryPeriod.Month3 => (to.AddMonths(-3), 24),
                SecurityHistoryPeriod.Month6 => (to.AddMonths(-6), 24),
                SecurityHistoryPeriod.Year1 => (to.AddYears(-1), 24),
                SecurityHistoryPeriod.Year5 => (to.AddYears(-5), 7),
                SecurityHistoryPeriod.Year10 => (to.AddYears(-10), 31),
                _ => (to.AddYears(-1), 24)
            };

            var security = await FindByTickerAsync(ticker);
                
            if (security == null)
            {
                return new SecurityHistoryDto();
            }

            var history = await _stockConnector.GetTickerHistoryAsync(security, from, to, interval);

            return CalculateHistoryStats(history);
        }

        private static SecurityHistoryDto CalculateHistoryStats(IEnumerable<SecurityHistoryValueDto> history)
        {
            var historyList = history.ToList();

            if (historyList.Count == 0)
            {
                return new SecurityHistoryDto();
            }

            var values = historyList.Select(h => h.Value).ToList();
            var startPrice = values[0];
            var endPrice = values[^1];
            var diff = endPrice - startPrice;
            var diffPercent = startPrice > 0 ? (diff / startPrice) * 100 : 0m;
            var minPrice = values.Min();
            var maxPrice = values.Max();
            var avgPrice = values.Average();

            return new SecurityHistoryDto
            {
                Values = historyList,
                StartPrice = startPrice,
                EndPrice = endPrice,
                Diff = diff,
                DiffPercent = diffPercent,
                MinPrice = minPrice,
                MaxPrice = maxPrice,
                AvgPrice = avgPrice
            };
        }

        public async Task<SecurityDto> AddAsync(SecurityDto securityDto, IFormFile securityIcon)
        {
            if (string.IsNullOrWhiteSpace(securityDto.Ticker))
            {
                throw new ArgumentException("Ticker cannot be empty.", nameof(securityDto));
            }

            var trimmedTicker = securityDto.Ticker.Trim();
            await ValidateTickerUniquenessAsync(trimmedTicker);

            var security = _mapper.Map(securityDto);
            security.Id = Guid.NewGuid();
            security.Ticker = trimmedTicker;
            
            if (securityIcon != null)
            {
                var key = $"{security.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, securityIcon, key);
                security.IconKey = key;
            }

            await _securityRepo.AddAsync(security);
            await _db.CommitAsync();

            return await GetByIdAsync(security.Id);
        }

        public async Task<SecurityDto> UpdateAsync(SecurityDto securityTypeDto, IFormFile securityIcon)
        {
            var trimmedTicker = securityTypeDto.Ticker?.Trim();
            if (!string.IsNullOrWhiteSpace(trimmedTicker))
            {
                await ValidateTickerUniquenessAsync(trimmedTicker, securityTypeDto.Id);
            }

            var existingSecurity = await _securityRepo.GetByIdAsync(securityTypeDto.Id);
            var security = _mapper.Map(securityTypeDto);
            if (!string.IsNullOrWhiteSpace(trimmedTicker))
            {
                security.Ticker = trimmedTicker;
            }

            if (securityIcon != null)
            {
                security.IconKey = $"{security.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, securityIcon, security.IconKey);
            }
            else if (string.IsNullOrEmpty(securityTypeDto.IconKey))
            {
                security.IconKey = null;
            }

            if (!string.IsNullOrEmpty(existingSecurity?.IconKey) && existingSecurity.IconKey != security.IconKey)
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, existingSecurity.IconKey);
            }

            _securityRepo.Update(security);
            await _db.CommitAsync();

            return await GetByIdAsync(security.Id);
        }

        public async Task DeleteAsync(Guid id)
        {
            var security = await _securityRepo.GetByIdAsync(id);
            if (security != null && !string.IsNullOrEmpty(security.IconKey))
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, security.IconKey);
            }

            await _securityRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        public async Task<FileStreamDto> GetIconStreamAsync(string iconKey)
        {
            return await _fileStorageService.GetFileStreamAsync(_iconsBucket, iconKey);
        }

        public async Task<string> GetIconUrlAsync(string iconKey)
        {
            return await _fileStorageService.GetFileUrlAsync(_iconsBucket, iconKey);
        }

        private async Task ValidateTickerUniquenessAsync(string ticker, Guid? currentId = null)
        {
            if (string.IsNullOrWhiteSpace(ticker))
            {
                return;
            }

            var upperTicker = ticker.ToUpper();
            var duplicate = await _securityRepo.FindAsync(
                s => (!currentId.HasValue || s.Id != currentId.Value) && s.Ticker.ToUpper() == upperTicker);

            if (duplicate != null)
            {
                throw new InvalidOperationException($"Security with ticker '{ticker}' already exists.");
            }
        }

        private IQueryable<Security> GetFullHierarchyColumns(IQueryable<Security> securityQuery)
        {
            return securityQuery
                .Include(security => security.Type)
                .Include(security => security.Currency);
        }
    }
}
