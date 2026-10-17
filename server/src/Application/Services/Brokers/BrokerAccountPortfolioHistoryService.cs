using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Utilities;

namespace Audex.Application.Services.Brokers
{
    public class BrokerAccountPortfolioHistoryService(
        ISecurityTransactionService securityTransactionService,
        IBrokerAccountFundsTransferService brokerAccountFundsTransferService,
        IDividendPaymentService dividendPaymentService,
        IBrokerAccountTaxDeductionService taxDeductionService,
        ISecurityService securityService,
        ISecurityPriceHistoryService securityPriceHistoryService,
        IBrokerAccountService brokerAccountService,
        IBrokerAccountSecurityService brokerAccountSecurityService,
        ILogger<BrokerAccountPortfolioHistoryService> logger = null) : IBrokerAccountPortfolioHistoryService
    {
        public async Task<BrokerAccountPortfolioDateBoundsDto> GetDateBoundsAsync(Guid? brokerAccountId = null)
        {
            var minDate = await ResolveMinDateAsync(brokerAccountId);
            var maxDate = await ResolveMaxDateAsync(brokerAccountId);

            return new BrokerAccountPortfolioDateBoundsDto
            {
                MinDate = minDate,
                MaxDate = DateUtilities.Max(maxDate, minDate)
            };
        }

        public async Task<IEnumerable<BrokerAccountPortfolioTimelinePointDto>> GetRangeHistoryAsync(
            DateOnly startDate,
            DateOnly endDate,
            Guid? brokerAccountId = null)
        {
            var dateBounds = await GetDateBoundsAsync(brokerAccountId);
            var clampedRange = ClampDateRange(startDate, endDate, dateBounds);
            if (!clampedRange.HasValue)
            {
                return [];
            }

            var (effectiveStartDate, effectiveEndDate) = clampedRange.Value;

            var timelineSources = await LoadTimelineSourcesAsync(effectiveEndDate, brokerAccountId);
            var securities = (await securityService.GetByIdsAsync(timelineSources.DistinctSecurityIds)).ToList();
            var pricesBySecurityAndDate = await LoadPricesBySecurityAsync(securities, effectiveStartDate, effectiveEndDate);

            return BuildTimelinePoints(
                effectiveStartDate,
                effectiveEndDate,
                timelineSources,
                securities,
                pricesBySecurityAndDate);
        }

        private async Task<BrokerAccountPortfolioTimelineSourcesDto> LoadTimelineSourcesAsync(
            DateOnly effectiveEndDate,
            Guid? brokerAccountId)
        {
            var transactions = (await securityTransactionService.GetTillDateAsync(effectiveEndDate, brokerAccountId)).ToList();
            var transfers = (await brokerAccountFundsTransferService.GetTillDateAsync(effectiveEndDate, brokerAccountId)).ToList();
            var dividends = (await dividendPaymentService.GetTillDateAsync(effectiveEndDate, brokerAccountId)).ToList();
            var taxDeductions = (await taxDeductionService.GetTillDateAsync(effectiveEndDate, brokerAccountId)).ToList();

            var transactionsByDate = transactions
                .GroupBy(transaction => DateOnly.FromDateTime(transaction.Date))
                .ToDictionary(group => group.Key, group => group.ToList());

            var transfersByDate = transfers
                .GroupBy(transfer => DateOnly.FromDateTime(transfer.Date))
                .ToDictionary(group => group.Key, group => group.ToList());

            var dividendsByDate = dividends
                .GroupBy(dividend => dividend.ReceivedAt)
                .ToDictionary(group => group.Key, group => group.ToList());

            var taxDeductionsByDate = taxDeductions
                .GroupBy(taxDeduction => DateOnly.FromDateTime(taxDeduction.DateApplied))
                .ToDictionary(group => group.Key, group => group.ToList());

            var distinctSecurityIds = transactions
                .Select(transaction => transaction.SecurityId)
                .Distinct()
                .ToList();

            var minDate = ResolveTimelineMinDate(transactions, transfers, dividends, taxDeductions);

            return new BrokerAccountPortfolioTimelineSourcesDto
            {
                TransactionsByDate = transactionsByDate,
                TransfersByDate = transfersByDate,
                DividendsByDate = dividendsByDate,
                TaxDeductionsByDate = taxDeductionsByDate,
                DistinctSecurityIds = distinctSecurityIds,
                MinDate = minDate
            };
        }

        private static DateOnly? ResolveTimelineMinDate(
            IReadOnlyList<SecurityTransactionDto> transactions,
            IReadOnlyList<BrokerAccountFundsTransferDto> transfers,
            IReadOnlyList<DividendPaymentDto> dividends,
            IReadOnlyList<BrokerAccountTaxDeductionDto> taxDeductions)
        {
            DateOnly? minDate = null;

            if (transactions.Count > 0)
            {
                var minTransactionDate = transactions.Min(transaction => DateOnly.FromDateTime(transaction.Date));
                minDate = DateUtilities.Min(minDate, minTransactionDate);
            }

            if (transfers.Count > 0)
            {
                var minTransferDate = transfers.Min(transfer => DateOnly.FromDateTime(transfer.Date));
                minDate = DateUtilities.Min(minDate, minTransferDate);
            }

            if (dividends.Count > 0)
            {
                var minDividendDate = dividends.Min(dividend => dividend.ReceivedAt);
                minDate = DateUtilities.Min(minDate, minDividendDate);
            }

            if (taxDeductions.Count > 0)
            {
                var minTaxDeductionDate = taxDeductions.Min(taxDeduction => DateOnly.FromDateTime(taxDeduction.DateApplied));
                minDate = DateUtilities.Min(minDate, minTaxDeductionDate);
            }

            return minDate;
        }

        private async Task<IReadOnlyDictionary<(Guid SecurityId, DateOnly Date), decimal>> LoadPricesBySecurityAsync(
            IReadOnlyList<SecurityDto> securities,
            DateOnly effectiveStartDate,
            DateOnly effectiveEndDate)
        {
            var securityIds = securities.Select(security => security.Id).ToList();

            await securityPriceHistoryService.EnsureSecurityPricesLoadedAsync(
                securities,
                effectiveStartDate,
                effectiveEndDate);

            var priceHistories = await securityPriceHistoryService.GetPriceHistoriesAsync(
                securityIds,
                effectiveStartDate,
                effectiveEndDate);

            return priceHistories
                .Where(priceHistory => priceHistory.ClosePrice > 0)
                .GroupBy(priceHistory => (priceHistory.SecurityId, priceHistory.Date))
                .ToDictionary(group => group.Key, group => group.Last().ClosePrice);
        }

        private List<BrokerAccountPortfolioTimelinePointDto> BuildTimelinePoints(
            DateOnly startDate,
            DateOnly endDate,
            BrokerAccountPortfolioTimelineSourcesDto timelineSources,
            IReadOnlyList<SecurityDto> securities,
            IReadOnlyDictionary<(Guid SecurityId, DateOnly Date), decimal> pricesBySecurityAndDate)
        {
            var securitiesMap = securities.ToDictionary(security => security.Id);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var minDate = DateUtilities.Min(timelineSources.MinDate, startDate);

            decimal cumulativeDeposited = 0m;
            decimal cumulativeWithdrawn = 0m;
            decimal cumulativeDividends = 0m;
            decimal cumulativeTaxDeductions = 0m;
            decimal cumulativePurchased = 0m;
            decimal cumulativeSold = 0m;
            var holdings = new Dictionary<Guid, int>();

            var timelinePoints = new List<BrokerAccountPortfolioTimelinePointDto>();

            for (var currentDate = minDate; currentDate <= endDate; currentDate = currentDate.AddDays(1))
            {
                if (timelineSources.TransfersByDate.TryGetValue(currentDate, out var dayTransfers))
                {
                    ApplyDailyTransfers(dayTransfers, ref cumulativeDeposited, ref cumulativeWithdrawn);
                }

                if (timelineSources.DividendsByDate.TryGetValue(currentDate, out var dayDividends))
                {
                    ApplyDailyDividends(dayDividends, ref cumulativeDividends);
                }

                if (timelineSources.TaxDeductionsByDate.TryGetValue(currentDate, out var dayTaxDeductions))
                {
                    ApplyDailyTaxDeductions(dayTaxDeductions, ref cumulativeTaxDeductions);
                }

                if (timelineSources.TransactionsByDate.TryGetValue(currentDate, out var dayTransactions))
                {
                    ApplyDailyTransactions(dayTransactions, holdings, ref cumulativePurchased, ref cumulativeSold);
                }

                if (currentDate >= startDate)
                {
                    var securitiesValue = CalculateTimelineSecuritiesValue(holdings, currentDate, today, securitiesMap, pricesBySecurityAndDate);

                    timelinePoints.Add(BuildTimelinePoint(
                        currentDate,
                        cumulativeDeposited,
                        cumulativeWithdrawn,
                        cumulativeDividends,
                        cumulativeTaxDeductions,
                        cumulativePurchased,
                        cumulativeSold,
                        securitiesValue));
                }
            }

            return timelinePoints;
        }

        private static void ApplyDailyTransfers(
            IReadOnlyList<BrokerAccountFundsTransferDto> dayTransfers,
            ref decimal cumulativeDeposited,
            ref decimal cumulativeWithdrawn)
        {
            foreach (var transfer in dayTransfers)
            {
                if (transfer.Income)
                {
                    cumulativeDeposited += transfer.Amount;
                }
                else
                {
                    cumulativeWithdrawn += transfer.Amount;
                }
            }
        }

        private static void ApplyDailyDividends(
            IReadOnlyList<DividendPaymentDto> dayDividends,
            ref decimal cumulativeDividends)
        {
            foreach (var dividend in dayDividends)
            {
                cumulativeDividends += dividend.NetAmount;
            }
        }

        private static void ApplyDailyTaxDeductions(
            IReadOnlyList<BrokerAccountTaxDeductionDto> dayTaxDeductions,
            ref decimal cumulativeTaxDeductions)
        {
            foreach (var taxDeduction in dayTaxDeductions)
            {
                cumulativeTaxDeductions += taxDeduction.Amount;
            }
        }

        private static void ApplyDailyTransactions(
            IReadOnlyList<SecurityTransactionDto> dayTransactions,
            Dictionary<Guid, int> holdings,
            ref decimal cumulativePurchased,
            ref decimal cumulativeSold)
        {
            foreach (var transaction in dayTransactions)
            {
                if (transaction.IsSell)
                {
                    cumulativeSold += transaction.NetTotalPrice;
                    holdings[transaction.SecurityId] = holdings.GetValueOrDefault(transaction.SecurityId) - transaction.Quantity;
                }
                else
                {
                    cumulativePurchased += transaction.NetTotalPrice;
                    holdings[transaction.SecurityId] = holdings.GetValueOrDefault(transaction.SecurityId) + transaction.Quantity;
                }
            }
        }

        private async Task<DateOnly?> ResolveMinDateAsync(Guid? brokerAccountId)
        {
            var earliestTransactionDate = await securityTransactionService.GetEarliestDateAsync(brokerAccountId);
            var earliestTransferDate = await brokerAccountFundsTransferService.GetEarliestDateAsync(brokerAccountId);

            return DateUtilities.Min(earliestTransactionDate, earliestTransferDate);
        }

        private async Task<DateOnly> ResolveMaxDateAsync(Guid? brokerAccountId)
        {
            var hasActiveAssets = await CheckHasActiveAssetsAsync(brokerAccountId);
            if (hasActiveAssets)
            {
                return DateOnly.FromDateTime(DateTime.UtcNow);
            }

            var latestTransactionDate = await securityTransactionService.GetLatestDateAsync(brokerAccountId);
            var latestTransferDate = await brokerAccountFundsTransferService.GetLatestDateAsync(brokerAccountId);

            return DateUtilities.Max(latestTransactionDate, latestTransferDate) ?? DateOnly.FromDateTime(DateTime.UtcNow);
        }

        private static (DateOnly startDate, DateOnly endDate)? ClampDateRange(
            DateOnly requestedStartDate,
            DateOnly requestedEndDate,
            BrokerAccountPortfolioDateBoundsDto dateBounds)
        {
            if (!dateBounds.MinDate.HasValue)
            {
                return null;
            }

            var effectiveStartDate = DateUtilities.Max(requestedStartDate, dateBounds.MinDate.Value);
            var effectiveEndDate = DateUtilities.Min(requestedEndDate, dateBounds.MaxDate);

            if (effectiveStartDate > effectiveEndDate)
            {
                return null;
            }

            return (effectiveStartDate, effectiveEndDate);
        }

        private decimal CalculateTimelineSecuritiesValue(
            Dictionary<Guid, int> holdings,
            DateOnly timelineDate,
            DateOnly today,
            IReadOnlyDictionary<Guid, SecurityDto> securitiesMap,
            IReadOnlyDictionary<(Guid SecurityId, DateOnly Date), decimal> pricesBySecurityAndDate)
        {
            decimal securitiesValue = 0m;

            foreach (var (securityId, quantity) in holdings)
            {
                if (quantity <= 0)
                {
                    continue;
                }

                decimal price = 0m;
                if (timelineDate >= today && securitiesMap.TryGetValue(securityId, out var security) && security.ActualPrice > 0)
                {
                    price = security.ActualPrice;
                }
                else if (pricesBySecurityAndDate.TryGetValue((securityId, timelineDate), out var historyPrice) && historyPrice > 0)
                {
                    price = historyPrice;
                }
                else
                {
                    var ticker = securitiesMap.TryGetValue(securityId, out var missingSecurity)
                        ? missingSecurity.Ticker
                        : securityId.ToString();

                    LogMissingHistoricalPrice(ticker, timelineDate);
                }

                securitiesValue += quantity * price;
            }

            return securitiesValue;
        }

        private static BrokerAccountPortfolioTimelinePointDto BuildTimelinePoint(
            DateOnly date,
            decimal totalDeposited,
            decimal totalWithdrawn,
            decimal totalDividends,
            decimal totalTaxDeduction,
            decimal totalPurchased,
            decimal totalSold,
            decimal securitiesValue)
        {
            decimal mainCurrencyAmount = totalDeposited + totalDividends + totalSold - totalWithdrawn - totalPurchased;
            decimal portfolioValue = mainCurrencyAmount + securitiesValue;
            decimal profitAndLoss = portfolioValue + totalTaxDeduction - (totalDeposited - totalWithdrawn);

            return new BrokerAccountPortfolioTimelinePointDto
            {
                Date = date,
                PortfolioValue = portfolioValue,
                ProfitAndLoss = profitAndLoss,
                TotalDeposited = totalDeposited,
                TotalWithdrawn = totalWithdrawn,
                MainCurrencyAmount = mainCurrencyAmount,
                SecuritiesValue = securitiesValue,
                TotalDividends = totalDividends,
                TotalTaxDeduction = totalTaxDeduction
            };
        }

        private async Task<bool> CheckHasActiveAssetsAsync(Guid? brokerAccountId)
        {
            if (brokerAccountId.HasValue)
            {
                var brokerAccount = await brokerAccountService.GetByIdAsync(brokerAccountId.Value);
                var securities = await brokerAccountSecurityService.GetByBrokerAccountAsync(brokerAccountId.Value);

                return (brokerAccount != null && brokerAccount.MainCurrencyAmount > 0) ||
                       securities.Any(brokerAccountSecurity => brokerAccountSecurity.Quantity > 0);
            }

            var allBrokerAccounts = await brokerAccountService.GetAllAsync();
            var allSecurities = await brokerAccountSecurityService.GetAllAsync();

            return allBrokerAccounts.Any(account => account.MainCurrencyAmount > 0) ||
                   allSecurities.Any(security => security.Quantity > 0);
        }

        public async Task<BrokerAccountPortfolioTimelinePointDto> GetHistoryAsync(DateOnly date, Guid? brokerAccountId = null)
        {
            var points = await GetRangeHistoryAsync(date, date, brokerAccountId);
            return points.FirstOrDefault() ?? new BrokerAccountPortfolioTimelinePointDto { Date = date };
        }

        private void LogMissingHistoricalPrice(string ticker, DateOnly date)
        {
            logger?.LogWarning(
                "[PortfolioHistory] Missing historical price for {Ticker} on {Date:yyyy-MM-dd}. Using 0 fallback.",
                ticker,
                date);
        }
    }
}
