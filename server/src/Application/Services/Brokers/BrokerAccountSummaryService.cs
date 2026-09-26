using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Integrations.Stock;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Interfaces.User;
using Audex.Infrastructure.Entities.Brokers;

namespace Audex.Application.Services.Brokers
{
    public class BrokerAccountSummaryService: IBrokerAccountSummaryService
    {
        private readonly IUserProfileService _userProfileService;
        private readonly IBrokerAccountSecurityService _brokerAccountSecurityService;
        private readonly IBrokerAccountFundsTransferService _fundsTransferService;
        private readonly IBrokerAccountService _brokerAccountService;
        private readonly IDividendPaymentService _dividendPaymentService;
        private readonly IStockConnector _stockConnector;
        private readonly IBrokerAccountTaxDeductionService _taxDeductionService;
        private readonly ISecurityTransactionService _securityTransactionService;

        public BrokerAccountSummaryService(
            IBrokerAccountSecurityService brokerAccountSecurityService,
            IBrokerAccountFundsTransferService fundsTransferService,
            IBrokerAccountService brokerAccountService,
            IDividendPaymentService dividendPaymentService,
            IStockConnector stockConnector,
            IUserProfileService userProfileService,
            IBrokerAccountTaxDeductionService taxDeductionService,
            ISecurityTransactionService securityTransactionService)
        {
            _brokerAccountSecurityService = brokerAccountSecurityService;
            _fundsTransferService = fundsTransferService;
            _stockConnector = stockConnector;
            _brokerAccountService = brokerAccountService;
            _dividendPaymentService = dividendPaymentService;
            _userProfileService = userProfileService;
            _taxDeductionService = taxDeductionService;
            _securityTransactionService = securityTransactionService;
        }

        public async Task<BrokerAccountSummaryDto> GetSummaryAsync()
        {
            var transfers = (await _fundsTransferService.GetAllAsync()).ToList();

            return new BrokerAccountSummaryDto()
            {
                TransferStats = GetTransfersStats(transfers),
                BrokerAccountStats = await GetBrokerAccountsStats()
            };
        }

        public async Task<BrokerAccountSummaryDto> GetSummaryByBrokerAccountAsync(Guid brokerAccountId)
        {
            var transfers = (await _fundsTransferService.GetAllAsync(brokerAccountId)).ToList();

            return new BrokerAccountSummaryDto()
            {
                TransferStats = GetTransfersStats(transfers),
                BrokerAccountStats = await GetBrokerAccountStats(brokerAccountId)
            };
        }

        public async Task<BrokerAccountDailyStatsDto> GetDailyStatsByBrokerAccountAsync(Guid brokerAccountId)
        {
            var securities = (await _brokerAccountSecurityService
                .GetByBrokerAccountAsync(brokerAccountId)).ToList();
            var brokerAccount = await _brokerAccountService.GetByIdAsync(brokerAccountId);

            return await GetDailyStats(securities, brokerAccount.MainCurrencyAmount);
        }

        public async Task<BrokerAccountDailyStatsDto> GetDailyStatsAsync()
        {
            var brokerAccountSecurities = (await _brokerAccountSecurityService.GetAllAsync()).ToList();
            var brokerAccounts = (await _brokerAccountService.GetAllAsync()).ToList();

            var amount = brokerAccounts.Sum(account => account.MainCurrencyAmount);

            return await GetDailyStats(brokerAccountSecurities, amount);
        }

        public async Task<BrokerAccountPortfolioDto> GetPortfolioValuesByBrokerAccountAsync(Guid brokerAccountId)
        {
            var brokerAccount = await _brokerAccountService.GetByIdAsync(brokerAccountId);

            return await GetPortfolioValues(brokerAccount);
        }

        public async Task<BrokerAccountPortfolioDto> GetPortfolioValuesAsync()
        {
            var brokerAccounts = await _brokerAccountService.GetAllAsync();

            var portfolioValues = new BrokerAccountPortfolioDto();

            // TODO: Possible different currencies
            foreach (var brokerAccount in brokerAccounts)
            {
                var portfolioValue = await GetPortfolioValues(brokerAccount);

                portfolioValues.CurrentAmount += portfolioValue.CurrentAmount;
                portfolioValues.DividendsIncome += portfolioValue.DividendsIncome;
                portfolioValues.TaxDeductions += portfolioValue.TaxDeductions;
                portfolioValues.ProfitAndLoss += portfolioValue.ProfitAndLoss;
                portfolioValues.MainCurrencyAmount += portfolioValue.MainCurrencyAmount;
                portfolioValues.BrokerCommissions += portfolioValue.BrokerCommissions;
                portfolioValues.StockExchangeCommissions += portfolioValue.StockExchangeCommissions;
                portfolioValues.TransactionTaxes += portfolioValue.TransactionTaxes;
            }

            return portfolioValues;
        }

        private async Task<BrokerAccountPortfolioDto> GetPortfolioValues(BrokerAccountDto brokerAccount)
        {
            var mainCurrencyAmount = brokerAccount.MainCurrencyAmount * brokerAccount.Currency.Rate;

            // TODO: Use single query to get both values
            var currentSecuritiesValue = await _brokerAccountSecurityService.GetActualSecuritiesValueAsync(brokerAccount.Id);
            var taxDeductions = await _taxDeductionService.GetAmountByBrokerAccountAsync(brokerAccount.Id);

            // TODO: Run in parallel
            var transfers = await _fundsTransferService.GetAllAsync(brokerAccount.Id);
            var depositedAmount = transfers.Sum(transfer => transfer.Income ? transfer.Amount : transfer.Amount * -1);

            var dividends = await _dividendPaymentService.GetEarningsByBrokerAccountAsync(brokerAccount.Id);
            var commissionsAndTaxes = await _securityTransactionService.GetCommissionsAndTaxesAsync(brokerAccount.Id);

            var currentAmount = currentSecuritiesValue + mainCurrencyAmount;

            return new BrokerAccountPortfolioDto
            {
                CurrentAmount = currentSecuritiesValue + mainCurrencyAmount,
                DividendsIncome = dividends,
                TaxDeductions = taxDeductions,
                ProfitAndLoss = currentAmount - depositedAmount + taxDeductions,
                MainCurrencyAmount = mainCurrencyAmount,
                BrokerCommissions = commissionsAndTaxes.BrokerCommissions,
                StockExchangeCommissions = commissionsAndTaxes.StockExchangeCommissions,
                TransactionTaxes = commissionsAndTaxes.TransactionTaxes
            };
        }

        private async Task<BrokerAccountDailyStatsDto> GetDailyStats(List<BrokerAccountSecurityDto> brokerAccountSecurities, 
            decimal portfolioMainCurrencyValue)
        {
            var securitySummaries = await GetSummaryPortfolioSecurities(brokerAccountSecurities);

            // TODO: Possible different currencies that cant be combined
            decimal startPortfolioValue = portfolioMainCurrencyValue;
            decimal currentPortfolioValue = portfolioMainCurrencyValue;

            foreach (var securitySummary in securitySummaries)
            {
                var currentPrice = securitySummary.CurrentPrice;
                var startPrice = securitySummary.StartPrice;

                startPortfolioValue += startPrice * securitySummary.Quantity;
                currentPortfolioValue += currentPrice * securitySummary.Quantity;
            }

            return new BrokerAccountDailyStatsDto()
            {
                FetchDate = DateTime.UtcNow,
                BrokerAccountDailySecurityStats = securitySummaries.OrderBy(stat => stat.CurrentPrice - stat.PreviousDayClosePrice),
                CurrentPortfolioValue = currentPortfolioValue,
                StartPortfolioValue = startPortfolioValue
            };
        }

        private async Task<List<BrokerAccountDailySecurityStatsDto>> GetSummaryPortfolioSecurities(List<BrokerAccountSecurityDto> brokerAccountSecurities)
        {
            var securities = brokerAccountSecurities
                .Select(brokerAccountSecurity => brokerAccountSecurity.Security)
                .DistinctBy(security => security.Ticker)
                .ToList();

            var tickers = securities.ToDictionary(key => key.Ticker, value => value);

            var securitiesQuantities = new Dictionary<Guid, int>();

            foreach (var brokerAccountSecurity in brokerAccountSecurities)
            {
                var securityId = brokerAccountSecurity.SecurityId;

                var quantity = brokerAccountSecurity.Quantity - brokerAccountSecurity.SoldQuantity;

                if (securitiesQuantities.ContainsKey(securityId))
                {
                    securitiesQuantities[securityId] += quantity;
                }
                else
                {
                    securitiesQuantities.Add(securityId, quantity);
                }
            }

            var marketValues = (await _stockConnector
                .GetExtendedValuesByTickersAsync(tickers.Values));

            var securityStats = new List<BrokerAccountDailySecurityStatsDto>();

            var handledTickers = new HashSet<string>();

            foreach (var marketValue in marketValues)
            {
                if (handledTickers.Contains(marketValue.Ticker))
                {
                    continue;
                }

                var security = tickers[marketValue.Ticker];

                var currentPrice = marketValue.GetLastValue();

                var quantity = securitiesQuantities[security.Id];

                if (quantity == 0)
                {
                    continue;
                }

                securityStats.Add(new BrokerAccountDailySecurityStatsDto()
                {
                    CurrentPrice = currentPrice,
                    Security = security,
                    StartPrice = marketValue.PrevPrice ?? marketValue.Open ?? 0,
                    MinPrice = marketValue.Low,
                    MaxPrice = marketValue.High,
                    PreviousDayClosePrice = marketValue.PrevPrice ?? 0,
                    Quantity = quantity
                });
                handledTickers.Add(marketValue.Ticker);
            }

            return securityStats;
        }

        public async Task<BrokerAccountMonthTransfersHistoryDto> GetMonthTransfersHistoryAsync(int month, int year)
        {
            var transfers = (await _fundsTransferService.GetAllAsync()).ToList();
            return GetMonthTransfersHistoryByBrokerAccount(transfers, month, year, allBrokerAccounts: true);
        }

        public async Task<BrokerAccountMonthTransfersHistoryDto> GetMonthTransfersHistoryByBrokerAccountAsync(Guid brokerAccountId, int month, int year)
        {
            var transfers = (await _fundsTransferService.GetAllAsync(brokerAccountId)).ToList();
            return GetMonthTransfersHistoryByBrokerAccount(transfers, month, year, allBrokerAccounts: false);
        }

        private BrokerAccountMonthTransfersHistoryDto GetMonthTransfersHistoryByBrokerAccount(
            List<BrokerAccountFundsTransferDto> transfers,
            int month,
            int year,
            bool allBrokerAccounts)
        {
            var filteredTransfers = transfers
                .Where(transfer => transfer.Date.Year == year && transfer.Date.Month == month);

            var daysInMonth = DateTime.DaysInMonth(year, month);
            var aggregation = AggregateTransfers(
                filteredTransfers,
                daysInMonth,
                transfer => transfer.Date.Day,
                allBrokerAccounts);

            var days = aggregation.Distributions.Select(pair => new BrokerAccountDayTransferDto
            {
                DayIndex = pair.Key,
                TotalDeposited = pair.Value.TotalDeposited,
                TotalWithdrawn = pair.Value.TotalWithdrawn,
                AccountValues = pair.Value.AccountValues.Values.ToList()
            }).ToList();

            return new BrokerAccountMonthTransfersHistoryDto
            {
                TotalDeposited = aggregation.TotalDeposited,
                TotalWithdrawn = aggregation.TotalWithdrawn,
                Accounts = aggregation.Accounts,
                Days = days
            };
        }

        public async Task<BrokerAccountYearTransfersHistoryDto> GetYearTransfersHistoryAsync(int year)
        {
            var transfers = (await _fundsTransferService.GetAllAsync()).ToList();
            return GetYearTransfersHistoryByBrokerAccount(transfers, year, allBrokerAccounts: true);
        }

        public async Task<BrokerAccountYearTransfersHistoryDto> GetYearTransfersHistoryByBrokerAccountAsync(Guid brokerAccountId, int year)
        {
            var transfers = (await _fundsTransferService.GetAllAsync(brokerAccountId)).ToList();
            return GetYearTransfersHistoryByBrokerAccount(transfers, year, allBrokerAccounts: false);
        }

        private BrokerAccountYearTransfersHistoryDto GetYearTransfersHistoryByBrokerAccount(
            List<BrokerAccountFundsTransferDto> transfers, 
            int year,
            bool allBrokerAccounts)
        {
            var filteredTransfers = transfers
                .Where(transfer => transfer.Date.Year == year);

            var aggregation = AggregateTransfers(
                filteredTransfers,
                12,
                transfer => transfer.Date.Month,
                allBrokerAccounts);

            var months = aggregation.Distributions.Select(pair => new BrokerAccountMonthTransferDto
            {
                MonthIndex = pair.Key,
                TotalDeposited = pair.Value.TotalDeposited,
                TotalWithdrawn = pair.Value.TotalWithdrawn,
                AccountValues = pair.Value.AccountValues.Values.ToList()
            }).ToList();

            return new BrokerAccountYearTransfersHistoryDto
            {
                TotalDeposited = aggregation.TotalDeposited,
                TotalWithdrawn = aggregation.TotalWithdrawn,
                Accounts = aggregation.Accounts,
                Months = months
            };
        }

        private static TransfersAggregationResult AggregateTransfers(
            IEnumerable<BrokerAccountFundsTransferDto> transfers,
            int slotsCount,
            Func<BrokerAccountFundsTransferDto, int> slotSelector,
            bool allBrokerAccounts)
        {
            var distributions = Enumerable.Range(1, slotsCount).ToDictionary(slotIndex => slotIndex, _ => new TransfersHistory());
            var periodAccountsMap = new Dictionary<Guid, BrokerAccountTransferAccountValueDto>();
            decimal totalDeposited = 0m;
            decimal totalWithdrawn = 0m;

            foreach (var transfer in transfers)
            {
                var slotIndex = slotSelector(transfer);
                if (!distributions.TryGetValue(slotIndex, out var distribution))
                {
                    continue;
                }

                var accountId = allBrokerAccounts ? transfer.BrokerAccountId : transfer.AccountId;
                var accountName = allBrokerAccounts
                    ? transfer.BrokerAccount?.Name ?? string.Empty
                    : transfer.Account?.Name ?? string.Empty;

                if (!distribution.AccountValues.TryGetValue(accountId, out var slotAccountValue))
                {
                    slotAccountValue = new BrokerAccountTransferAccountValueDto
                    {
                        AccountId = accountId,
                        AccountName = accountName
                    };
                    distribution.AccountValues[accountId] = slotAccountValue;
                }

                if (!periodAccountsMap.TryGetValue(accountId, out var periodAccountValue))
                {
                    periodAccountValue = new BrokerAccountTransferAccountValueDto
                    {
                        AccountId = accountId,
                        AccountName = accountName
                    };
                    periodAccountsMap[accountId] = periodAccountValue;
                }

                if (transfer.Income)
                {
                    distribution.TotalDeposited += transfer.Amount;
                    slotAccountValue.Deposited += transfer.Amount;

                    totalDeposited += transfer.Amount;
                    periodAccountValue.Deposited += transfer.Amount;
                }
                else
                {
                    distribution.TotalWithdrawn += transfer.Amount;
                    slotAccountValue.Withdrawn += transfer.Amount;

                    totalWithdrawn += transfer.Amount;
                    periodAccountValue.Withdrawn += transfer.Amount;
                }
            }

            return new TransfersAggregationResult
            {
                TotalDeposited = totalDeposited,
                TotalWithdrawn = totalWithdrawn,
                Accounts = periodAccountsMap.Values.ToList(),
                Distributions = distributions
            };
        }

        public async Task<BrokerAccountTransfersAvailableDatesDto> GetTransfersAvailableDatesAsync(Guid? brokerAccountId)
        {
            var transfers = brokerAccountId.HasValue
                ? (await _fundsTransferService.GetAllAsync(brokerAccountId.Value)).ToList()
                : (await _fundsTransferService.GetAllAsync()).ToList();

            if (transfers.Count == 0)
            {
                var currentYear = DateTime.UtcNow.Year;
                var currentMonth = DateTime.UtcNow.Month;
                return new BrokerAccountTransfersAvailableDatesDto
                {
                    AvailableYears = new List<int> { currentYear },
                    AvailableMonthsByYear = new Dictionary<int, List<int>>
                    {
                        { currentYear, new List<int> { currentMonth } }
                    }
                };
            }

            var availableYears = transfers
                .Select(transfer => transfer.Date.Year)
                .Distinct()
                .OrderByDescending(year => year)
                .ToList();

            var availableMonthsByYear = transfers
                .GroupBy(transfer => transfer.Date.Year)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(transfer => transfer.Date.Month).Distinct().OrderBy(month => month).ToList()
                );

            return new BrokerAccountTransfersAvailableDatesDto
            {
                AvailableYears = availableYears,
                AvailableMonthsByYear = availableMonthsByYear
            };
        }

        private BrokerAccountTransfersStatsDto GetTransfersStats(List<BrokerAccountFundsTransferDto> transfers)
        {
            var deposits = transfers
                .Where(transfer => transfer.Income);

            var withdrawals = transfers
                .Where(transfer => !transfer.Income);

            var totalDeposit = deposits.Sum(transfer => transfer.Amount);
            var totalWithdraw = withdrawals.Sum(transfer => transfer.Amount);

            return new BrokerAccountTransfersStatsDto()
            {
                TotalDeposited = totalDeposit,
                TotalWithdrawn = totalWithdraw
            };
        }

        private async Task<BrokerAccountStatsDto> GetBrokerAccountsStats()
        {
            var portfolioValues = await GetPortfolioValuesAsync();
            var totalDividends = await _dividendPaymentService.GetEarningsAsync();

            return new BrokerAccountStatsDto()
            {
                CurrentValue = portfolioValues.CurrentAmount,
                // TODO: rework
                InvestedValue = portfolioValues.CurrentAmount - portfolioValues.ProfitAndLoss,
                TotalDividendsValue = totalDividends
            };
        }

        private async Task<BrokerAccountStatsDto> GetBrokerAccountStats(Guid brokerAccountId)
        {
            var portfolioValues = await GetPortfolioValuesAsync();
            var totalDividends = await _dividendPaymentService.GetEarningsByBrokerAccountAsync(brokerAccountId);

            return new BrokerAccountStatsDto()
            {
                CurrentValue = portfolioValues.CurrentAmount,
                // TODO: rework
                InvestedValue = portfolioValues.CurrentAmount - portfolioValues.ProfitAndLoss,
                TotalDividendsValue = totalDividends
            };
        }

        private class TransfersAggregationResult
        {
            public decimal TotalDeposited { get; set; }
            public decimal TotalWithdrawn { get; set; }
            public List<BrokerAccountTransferAccountValueDto> Accounts { get; set; } = new();
            public Dictionary<int, TransfersHistory> Distributions { get; set; } = new();
        }

        private class TransfersHistory
        {
            public decimal TotalDeposited { get; set; }
            public decimal TotalWithdrawn { get; set; }
            public Dictionary<Guid, BrokerAccountTransferAccountValueDto> AccountValues { get; set; } = new();
        }


    }
}
