#nullable enable
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Audex.Application.Constants;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Notifications;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Securities
{
    public class SecurityPriceHistoryService(
        IUnitOfWork unitOfWork,
        IStockConnector stockConnector,
        ISecurityService securityService,
        ISecurityTransactionService securityTransactionService,
        ApplicationMapper applicationMapper,
        INotificationService notificationService,
        ILocalizationService localizer,
        ILogger<SecurityPriceHistoryService>? logger = null) : ISecurityPriceHistoryService
    {
        private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> SecurityLocks = new();
        private const int PoliteDelayMs = 150;
        private const int FetchLookbackMonths = 1;
        private const int ExtendedFetchLookbackYears = 1;

        private readonly IRepository<SecurityPriceHistory> _securityPriceHistoryRepository = unitOfWork.CreateRepository<SecurityPriceHistory>();

        public async Task<int> SyncActiveSecuritiesPriceHistoryAsync(CancellationToken cancellationToken = default)
        {
            var activeSecurityIds = (await securityTransactionService.GetDistinctSecurityIdsAsync()).ToList();
            if (activeSecurityIds.Count == 0)
            {
                return 0;
            }

            var securities = (await securityService.GetByIdsAsync(activeSecurityIds)).ToList();

            await EnsureSecurityPricesLoadedAsync(securities, cancellationToken: cancellationToken);
            return securities.Count;
        }

        public async Task EnsureSecurityPricesLoadedAsync(
            IEnumerable<SecurityDto> securities,
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            CancellationToken cancellationToken = default)
        {
            var effectiveEndDate = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            foreach (var security in securities)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                await EnsureSingleSecurityPricesLoadedAsync(security, startDate, effectiveEndDate, cancellationToken);
            }
        }

        public async Task<IEnumerable<SecurityPriceHistoryDto>> GetPriceHistoriesAsync(
            IEnumerable<Guid> securityIds,
            DateOnly startDate,
            DateOnly endDate)
        {
            var securityIdList = securityIds.ToList();
            var priceHistories = await _securityPriceHistoryRepository.GetAllAsync(
                priceHistory => securityIdList.Contains(priceHistory.SecurityId) &&
                                priceHistory.Date >= startDate &&
                                priceHistory.Date <= endDate,
                disableTracking: true);

            return applicationMapper.Map(priceHistories);
        }

        public async Task<Dictionary<Guid, decimal>> GetPriceMapTillDateAsync(
            IEnumerable<Guid> securityIds,
            DateOnly date)
        {
            var securityIdList = securityIds.ToList();
            var priceHistories = await _securityPriceHistoryRepository.GetAllAsync(
                priceHistory => securityIdList.Contains(priceHistory.SecurityId) &&
                                priceHistory.Date <= date &&
                                priceHistory.ClosePrice > 0,
                disableTracking: true);

            return priceHistories
                .GroupBy(priceHistory => priceHistory.SecurityId)
                .ToDictionary(
                    group => group.Key,
                    group => group.OrderBy(priceHistory => priceHistory.Date).LastOrDefault()?.ClosePrice ?? 0m);
        }


        private async Task EnsureSingleSecurityPricesLoadedAsync(
            SecurityDto security,
            DateOnly? requestedStartDate,
            DateOnly requestedEndDate,
            CancellationToken cancellationToken)
        {
            var securityLock = SecurityLocks.GetOrAdd(security.Id, _ => new SemaphoreSlim(1, 1));
            await securityLock.WaitAsync(cancellationToken);
            try
            {
                var effectiveStartDate = await CalculateEffectiveStartDateAsync(security, requestedStartDate, requestedEndDate);
                if (effectiveStartDate > requestedEndDate)
                {
                    return;
                }

                var (missingDates, existingDates) = await FindMissingDatesAsync(security.Id, effectiveStartDate, requestedEndDate);
                if (missingDates.Count == 0)
                {
                    return;
                }

                var rangeStart = missingDates[0];
                var rangeEnd = missingDates[^1];

                await FetchAndSaveCandlesAsync(security, rangeStart, rangeEnd, existingDates, cancellationToken);
                await Task.Delay(PoliteDelayMs, cancellationToken);
            }
            finally
            {
                securityLock.Release();
            }
        }

        private async Task<DateOnly> CalculateEffectiveStartDateAsync(
            SecurityDto security,
            DateOnly? requestedStartDate,
            DateOnly requestedEndDate)
        {
            if (requestedStartDate.HasValue)
            {
                return requestedStartDate.Value;
            }

            var earliestTransactionDate = await securityTransactionService.GetEarliestDateBySecurityAsync(security.Id);
            return earliestTransactionDate ?? requestedEndDate.AddMonths(-1);
        }

        private async Task<(List<DateOnly> missingDates, HashSet<DateOnly> existingDates)> FindMissingDatesAsync(
            Guid securityId,
            DateOnly startDate,
            DateOnly endDate)
        {
            var existingHistories = await GetPriceHistoriesAsync([securityId], startDate, endDate);
            var existingDates = existingHistories.Select(history => history.Date).ToHashSet();
            var missingDates = new List<DateOnly>();

            for (var currentDate = startDate; currentDate <= endDate; currentDate = currentDate.AddDays(1))
            {
                if (!existingDates.Contains(currentDate))
                {
                    missingDates.Add(currentDate);
                }
            }

            return (missingDates, existingDates);
        }

        private async Task FetchAndSaveCandlesAsync(
            SecurityDto security,
            DateOnly fromDate,
            DateOnly toDate,
            HashSet<DateOnly> existingDates,
            CancellationToken cancellationToken)
        {
            if (fromDate > toDate)
            {
                return;
            }

            // offset for cases when startDate has no trades + 1 month (holidays, weekends, etc.)
            var fetchFromDate = fromDate.AddMonths(-FetchLookbackMonths - 1);
            var candles = (await FetchCandlesSafeAsync(security, fetchFromDate, toDate)).ToList();
            
            var candlesByDate = BuildCandlePriceMap(candles);
            var startDatePrice = await GetStartDateSecurityPriceAsync(security, fromDate, candles);

            var newEntities = BuildPriceHistoryEntities(
                security.Id,
                fromDate,
                toDate,
                candlesByDate,
                existingDates,
                startDatePrice,
                cancellationToken);

            await StorePriceHistoryAsync(newEntities);

            LogSaveResult(security.Ticker, fromDate, toDate, newEntities.Count);
        }

        private async Task<IEnumerable<SecurityCandleDto>> FetchCandlesSafeAsync(
            SecurityDto security,
            DateOnly fromDate,
            DateOnly toDate)
        {
            try
            {
                LogFetchingRange(security.Ticker, fromDate, toDate);
                var candles = (await stockConnector.GetCandlesAsync(security, fromDate, toDate, interval: 24))?.ToList() ?? [];
                LogCandlesLoaded(security.Ticker, candles.Count);
                return candles;
            }
            catch (Exception exception)
            {
                logger?.LogError(exception, "[SecurityPriceHistory] Ошибка при загрузке по тикеру {Ticker}", security.Ticker);
                return [];
            }
        }

        private static Dictionary<DateOnly, decimal> BuildCandlePriceMap(IEnumerable<SecurityCandleDto> candles)
        {
            var candlesByDate = new Dictionary<DateOnly, decimal>();
            foreach (var candle in candles)
            {
                if (candle.Close > 0)
                {
                    var candleDate = DateOnly.FromDateTime(candle.End);
                    candlesByDate[candleDate] = candle.Close;
                }
            }
            return candlesByDate;
        }

        private async Task<decimal> GetStartDateSecurityPriceAsync(
            SecurityDto security,
            DateOnly startDate,
            IReadOnlyList<SecurityCandleDto> candles)
        {
            var candleBeforeOrAtStartDate = candles
                .Where(candle => DateOnly.FromDateTime(candle.End) <= startDate && candle.Close > 0)
                .OrderBy(candle => candle.End)
                .LastOrDefault();

            if (candleBeforeOrAtStartDate != null)
            {
                return candleBeforeOrAtStartDate.Close;
            }

            return await FetchExtendedLookbackPriceAsync(security, startDate);
        }

        private async Task<decimal> FetchExtendedLookbackPriceAsync(SecurityDto security, DateOnly startDate)
        {
            var extendedFromDate = startDate.AddYears(-ExtendedFetchLookbackYears);
            var extendedCandles = await FetchCandlesSafeAsync(security, extendedFromDate, startDate);
            var lastExtendedCandle = extendedCandles
                .Where(candle => candle.Close > 0)
                .OrderBy(candle => candle.End)
                .LastOrDefault();

            if (lastExtendedCandle != null)
            {
                return lastExtendedCandle.Close;
            }

            logger?.LogWarning(
                "[SecurityPriceHistory] No price quotes found for security {Ticker} within the last year before {Date}",
                security.Ticker,
                startDate);

            await NotifyMissingQuotesAsync(security, startDate);
            return 0m;
        }

        private async Task NotifyMissingQuotesAsync(SecurityDto security, DateOnly beforeDate)
        {
            try
            {
                var title = await localizer.GetForUserAsync(
                    LocalizationKeys.Notifications.MissingSecurityQuotesTitle,
                    UserProfileConstants.UserProfileId);

                var message = await localizer.GetForUserAsync(
                    LocalizationKeys.Notifications.MissingSecurityQuotesMessage,
                    UserProfileConstants.UserProfileId,
                    security.Ticker,
                    beforeDate.ToString("yyyy-MM-dd"));

                await notificationService.CreateAsync(
                    title: title,
                    message: message,
                    severity: NotificationSeverity.Warning,
                    category: "Securities",
                    userProfileId: UserProfileConstants.UserProfileId);
            }
            catch (Exception exception)
            {
                logger?.LogWarning(exception, "[SecurityPriceHistory] Не удалось отправить уведомление об отсутствии котировок для {Ticker}", security.Ticker);
            }
        }

        private static List<SecurityPriceHistory> BuildPriceHistoryEntities(
            Guid securityId,
            DateOnly fromDate,
            DateOnly toDate,
            IReadOnlyDictionary<DateOnly, decimal> candlesByDate,
            HashSet<DateOnly> existingDates,
            decimal startDatePrice,
            CancellationToken cancellationToken)
        {
            var entities = new List<SecurityPriceHistory>();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var lastKnownPrice = startDatePrice;

            for (var currentDate = fromDate; currentDate <= toDate; currentDate = currentDate.AddDays(1))
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                if (existingDates.Contains(currentDate))
                {
                    continue;
                }

                if (currentDate >= today && !candlesByDate.ContainsKey(currentDate))
                {
                    continue;
                }

                if (candlesByDate.TryGetValue(currentDate, out decimal candlePrice) && candlePrice > 0)
                {
                    lastKnownPrice = candlePrice;
                }

                entities.Add(new SecurityPriceHistory
                {
                    Id = Guid.NewGuid(),
                    SecurityId = securityId,
                    Date = currentDate,
                    ClosePrice = lastKnownPrice,
                    FetchedAt = DateTime.UtcNow
                });

                existingDates.Add(currentDate);
            }

            return entities;
        }

        private async Task StorePriceHistoryAsync(IReadOnlyCollection<SecurityPriceHistory> priceHistories)
        {
            if (priceHistories.Count == 0)
            {
                return;
            }

            await _securityPriceHistoryRepository.AddRangeAsync(priceHistories);
            await unitOfWork.CommitAsync();
        }

        private void LogFetchingRange(string ticker, DateOnly fromDate, DateOnly toDate)
        {
            logger?.LogInformation("[SecurityPriceHistory] Грузим по тикеру {Ticker} даты {FromDate:yyyy-MM-dd} - {ToDate:yyyy-MM-dd}", ticker, fromDate, toDate);
        }

        private void LogCandlesLoaded(string ticker, int count)
        {
            logger?.LogInformation("[SecurityPriceHistory] Загружено свечей: {Count}", count);
        }

        private void LogSaveResult(string ticker, DateOnly fromDate, DateOnly toDate, int savedCount)
        {
            logger?.LogInformation(
                "[SecurityPriceHistory] Загружено по тикеру {Ticker} даты {FromDate:yyyy-MM-dd} - {ToDate:yyyy-MM-dd}, сохранено записей: {SavedCount}",
                ticker,
                fromDate,
                toDate,
                savedCount);
        }
    }
}
