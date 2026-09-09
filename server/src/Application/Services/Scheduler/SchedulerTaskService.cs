using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Utilities.Scheduler;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Database;
using TickerQ.Utilities.Entities;
using TickerQ.Utilities.Interfaces.Managers;
using TickerQ.Utilities.Enums;

namespace Audex.Application.Services.Scheduler
{
    public class SchedulerTaskService : ISchedulerTaskService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<ScheduledCronTicker> _tickerRepo;
        private readonly IRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>> _occurrenceRepo;
        private readonly IScheduledJobRegistry _jobRegistry;
        private readonly ILocalizationService _localizer;
        private readonly ILogger<SchedulerTaskService> _logger;

        public SchedulerTaskService(
            IUnitOfWork unitOfWork,
            IScheduledJobRegistry jobRegistry,
            ILocalizationService localizer,
            ILogger<SchedulerTaskService> logger)
        {
            _db = unitOfWork;
            _tickerRepo = unitOfWork.CreateRepository<ScheduledCronTicker>();
            _occurrenceRepo = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            _jobRegistry = jobRegistry;
            _localizer = localizer;
            _logger = logger;
        }

        public async Task<IEnumerable<ScheduledTaskDefinitionDto>> GetNotScheduledTasksAsync()
        {
            var lang = await _localizer.GetUserLanguageAsync();

            var tickers = await _tickerRepo.GetAllAsync(disableTracking: true);
            var configuredNames = tickers
                .Select(ticker => ticker.Function)
                .Where(functionName => !string.IsNullOrEmpty(functionName));
            var configuredSet = new HashSet<string>(configuredNames, StringComparer.OrdinalIgnoreCase);

            var descriptors = _jobRegistry.GetAllDescriptors();
            return descriptors
                .Where(descriptor => !configuredSet.Contains(descriptor.TaskName))
                .Select(descriptor => new ScheduledTaskDefinitionDto
                {
                    TaskName = descriptor.TaskName,
                    DisplayName = !string.IsNullOrWhiteSpace(descriptor.DisplayNameKey) ? _localizer.Get(descriptor.DisplayNameKey, lang) : descriptor.TaskName,
                    Description = !string.IsNullOrWhiteSpace(descriptor.DescriptionKey) ? _localizer.Get(descriptor.DescriptionKey, lang) : string.Empty,
                    Category = !string.IsNullOrWhiteSpace(descriptor.CategoryKey) ? _localizer.Get(descriptor.CategoryKey, lang) : "General",
                    DefaultCronExpression = descriptor.DefaultCronExpression
                }).ToList();
        }

        public async Task<IEnumerable<ScheduledTaskDto>> GetAllTasksAsync()
        {
            var lang = await _localizer.GetUserLanguageAsync();

            var tickers = await _tickerRepo.GetAllAsync(
                include: GetFullHierarchyColumns,
                disableTracking: true);
            var currentUtcTime = DateTime.UtcNow;

            return tickers
                .Where(ticker => _jobRegistry.TryGetDescriptor(ticker.Function, out _))
                .Select(ticker =>
                {
                    var descriptor = _jobRegistry.TryGetDescriptor(ticker.Function, out var jobDescriptor) ? jobDescriptor : null;
                    var latestOccurrence = ticker.Occurrences.FirstOrDefault();
                    return MapToDto(ticker, descriptor, latestOccurrence, currentUtcTime, lang);
                })
                .ToList();
        }

        public async Task<ScheduledTaskDto> GetTaskByNameAsync(string taskName)
        {
            if (string.IsNullOrWhiteSpace(taskName))
            {
                return null;
            }

            var lang = await _localizer.GetUserLanguageAsync();

            var tickers = await _tickerRepo.GetAllAsync(
                filter: ticker => ticker.Function == taskName,
                include: GetFullHierarchyColumns,
                disableTracking: true);

            var ticker = tickers.FirstOrDefault();
            if (ticker == null)
            {
                return null;
            }

            var descriptor = _jobRegistry.TryGetDescriptor(taskName, out var jobDescriptor) ? jobDescriptor : null;
            var latestOccurrence = ticker.Occurrences.FirstOrDefault();
            return MapToDto(ticker, descriptor, latestOccurrence, DateTime.UtcNow, lang);
        }

        public async Task<ScheduledTaskDto> CreateTaskAsync(CreateScheduledTaskDto dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            if (!_jobRegistry.TryGetDescriptor(dto.TaskName, out var descriptor))
            {
                throw new ArgumentException($"Unknown task type: '{dto.TaskName}'", nameof(dto.TaskName));
            }

            var cronExpression = string.IsNullOrWhiteSpace(dto.CronExpression)
                ? descriptor.DefaultCronExpression
                : dto.CronExpression;

            if (!CronExpressionHelper.IsValidCronExpression(cronExpression))
            {
                throw new ArgumentException($"Invalid Cron expression: '{cronExpression}'", nameof(dto.CronExpression));
            }

            var tickerCronExpression = CronExpressionHelper.ToTickerQCron(cronExpression);

            var existingTicker = await _tickerRepo.FindAsync(ticker => ticker.Function == dto.TaskName);

            if (existingTicker != null)
            {
                throw new InvalidOperationException($"Task '{dto.TaskName}' is already created. Only one schedule per task is allowed.");
            }

            var lang = await _localizer.GetUserLanguageAsync();

            var newTicker = new ScheduledCronTicker
            {
                Id = Guid.NewGuid(),
                Description = !string.IsNullOrWhiteSpace(descriptor.DisplayNameKey) ? _localizer.Get(descriptor.DisplayNameKey, lang) : descriptor.TaskName,
                Function = descriptor.TaskName,
                Expression = tickerCronExpression,
                IsEnabled = dto.IsEnabled
            };

            await _tickerRepo.AddAsync(newTicker);
            await _db.CommitAsync();

            return MapToDto(newTicker, descriptor, null, DateTime.UtcNow, lang);
        }

        public async Task<bool> UpdateScheduleAsync(string taskName, UpdateScheduleDto dto)
        {
            if (string.IsNullOrWhiteSpace(taskName) || dto == null)
            {
                return false;
            }

            var ticker = await _tickerRepo.FindAsync(t => t.Function == taskName, disableTracking: false);

            if (ticker == null)
            {
                return false;
            }

            bool deletePendingOccurrences = false;

            if (!string.IsNullOrWhiteSpace(dto.CronExpression))
            {
                if (!CronExpressionHelper.IsValidCronExpression(dto.CronExpression))
                {
                    throw new ArgumentException($"Invalid Cron expression: '{dto.CronExpression}'", nameof(dto.CronExpression));
                }

                var newExpression = CronExpressionHelper.ToTickerQCron(dto.CronExpression);
                if (ticker.Expression != newExpression)
                {
                    ticker.Expression = newExpression;
                    deletePendingOccurrences = true;
                }
            }

            if (dto.IsEnabled.HasValue)
            {
                ticker.IsEnabled = dto.IsEnabled.Value;
                if (!ticker.IsEnabled)
                {
                    deletePendingOccurrences = true;
                }
            }

            if (deletePendingOccurrences) 
            {
                await RemovePendingOccurrencesAsync(ticker.Id);
            }

            _tickerRepo.Update(ticker);
            await _db.CommitAsync();

            return true;
        }

        public async Task<bool> ToggleTaskStatusAsync(string taskName, bool isEnabled)
        {
            if (string.IsNullOrWhiteSpace(taskName))
            {
                return false;
            }

            var ticker = await _tickerRepo.FindAsync(t => t.Function == taskName, disableTracking: false);

            if (ticker == null)
            {
                return false;
            }

            ticker.IsEnabled = isEnabled;
            if (!isEnabled)
            {
                await RemovePendingOccurrencesAsync(ticker.Id);
            }

            _tickerRepo.Update(ticker);
            await _db.CommitAsync();

            return true;
        }

        public async Task<bool> DeleteTaskAsync(string taskName)
        {
            if (string.IsNullOrWhiteSpace(taskName))
            {
                return false;
            }

            var ticker = await _tickerRepo.FindAsync(t => t.Function == taskName);

            if (ticker == null)
            {
                return false;
            }

            await RemovePendingOccurrencesAsync(ticker.Id);
            await _tickerRepo.DeleteAsync(ticker.Id);
            await _db.CommitAsync();
            return true;
        }

        private async Task RemovePendingOccurrencesAsync(Guid tickerId)
        {
            var pendingOccurrences = await _occurrenceRepo.GetAllAsync(
                occurrence => occurrence.CronTickerId == tickerId &&
                              (occurrence.Status == TickerStatus.Idle || occurrence.Status == TickerStatus.Queued));

            foreach (var pending in pendingOccurrences)
            {
                await _occurrenceRepo.DeleteAsync(pending.Id);
            }
        }

        private ScheduledTaskDto MapToDto(
            ScheduledCronTicker ticker,
            ScheduledJobDescriptor descriptor,
            CronTickerOccurrenceEntity<ScheduledCronTicker> latestOccurrence,
            DateTime currentUtcTime,
            string lang)
        {
            var taskName = descriptor?.TaskName ?? ticker.Function;
            var displayName = !string.IsNullOrWhiteSpace(descriptor?.DisplayNameKey)
                ? _localizer.Get(descriptor.DisplayNameKey, lang)
                : taskName;
            var description = !string.IsNullOrWhiteSpace(descriptor?.DescriptionKey)
                ? _localizer.Get(descriptor.DescriptionKey, lang)
                : ticker.Description ?? string.Empty;
            var category = !string.IsNullOrWhiteSpace(descriptor?.CategoryKey)
                ? _localizer.Get(descriptor.CategoryKey, lang)
                : "General";
            var clientCronExpression = CronExpressionHelper.ToStandardCron(ticker.Expression);

            var lastStatus = latestOccurrence != null
                ? SchedulerStatusMapper.ToExecutionStatus(latestOccurrence.Status)
                : ScheduledTaskExecutionStatus.Unknown;

            return new ScheduledTaskDto
            {
                TaskName = taskName,
                DisplayName = displayName,
                Description = description,
                CronExpression = clientCronExpression,
                IsEnabled = ticker.IsEnabled,
                Category = category,
                LastExecutionUtc = latestOccurrence?.ExecutedAt ?? (latestOccurrence != null ? latestOccurrence.ExecutionTime : null),
                LastExecutionStatus = lastStatus,
                LastExecutionDurationMs = latestOccurrence?.ElapsedTime,
                NextExecutionUtc = ticker.IsEnabled ? CronExpressionHelper.GetNextExecutionUtc(ticker.Expression, currentUtcTime) : null
            };
        }

        private static IQueryable<ScheduledCronTicker> GetFullHierarchyColumns(IQueryable<ScheduledCronTicker> query)
        {
            return query.Include(ticker => ticker.Occurrences
                .Where(occurrence => occurrence.Status != TickerStatus.Idle && occurrence.Status != TickerStatus.Queued)
                .OrderByDescending(occurrence => occurrence.ExecutedAt ?? occurrence.ExecutionTime)
                .Take(1));
        }
    }
}
