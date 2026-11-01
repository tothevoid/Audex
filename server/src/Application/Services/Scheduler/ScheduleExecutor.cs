using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Database;
using TickerQ.Utilities.Entities;
using TickerQ.Utilities.Enums;

namespace Audex.Application.Services.Scheduler
{
    public class ScheduleExecutor : IScheduleExecutor
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<ScheduledCronTicker> _tickerRepo;
        private readonly IRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>> _occurrenceRepo;
        private readonly IScheduledJobRegistry _jobRegistry;
        private readonly IEnumerable<IScheduledJob> _jobs;
        private readonly ILogger<ScheduleExecutor> _logger;

        public ScheduleExecutor(
            IUnitOfWork unitOfWork,
            IScheduledJobRegistry jobRegistry,
            IEnumerable<IScheduledJob> jobs,
            ILogger<ScheduleExecutor> logger)
        {
            _db = unitOfWork;
            _tickerRepo = unitOfWork.CreateRepository<ScheduledCronTicker>();
            _occurrenceRepo = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            _jobRegistry = jobRegistry;
            _jobs = jobs;
            _logger = logger;
        }

        public async Task ExecuteJobAsync(
            string taskName,
            ScheduledTaskTriggerSource triggerSource = ScheduledTaskTriggerSource.Manual,
            CancellationToken cancellationToken = default)
        {
            if (!_jobRegistry.TryGetDescriptor(taskName, out var descriptor))
            {
                throw new ArgumentException($"Unknown task '{taskName}'", nameof(taskName));
            }

            var ticker = await _tickerRepo.FindAsync(tickerEntity => tickerEntity.Function == taskName);
            if (ticker == null)
            {
                throw new InvalidOperationException($"Task '{taskName}' is not configured/registered by user. Create a schedule first.");
            }

            var job = _jobs.FirstOrDefault(registeredJob => registeredJob.GetType() == descriptor.JobType);
            if (job == null)
            {
                throw new InvalidOperationException($"Job instance for '{descriptor.JobType.Name}' was not found in DI container.");
            }

            cancellationToken.ThrowIfCancellationRequested();

            var occurrence = new CronTickerOccurrenceEntity<ScheduledCronTicker>
            {
                Id = Guid.NewGuid(),
                CronTickerId = ticker.Id,
                ExecutionTime = DateTime.UtcNow,
                ExecutedAt = DateTime.UtcNow,
                Status = TickerStatus.InProgress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _occurrenceRepo.AddAsync(occurrence);
            await _db.CommitAsync();

            var stopwatch = Stopwatch.StartNew();
            try
            {
                await job.ExecuteAsync(triggerSource, cancellationToken, occurrenceId: occurrence.Id);
                stopwatch.Stop();

                occurrence.Status = TickerStatus.Done;
                occurrence.ElapsedTime = stopwatch.ElapsedMilliseconds;
                occurrence.UpdatedAt = DateTime.UtcNow;
                _occurrenceRepo.Update(occurrence);
                await _db.CommitAsync();
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                stopwatch.Stop();
                occurrence.Status = TickerStatus.Cancelled;
                occurrence.ElapsedTime = stopwatch.ElapsedMilliseconds;
                occurrence.ExceptionMessage = "The operation was canceled.";
                occurrence.UpdatedAt = DateTime.UtcNow;
                _occurrenceRepo.Update(occurrence);
                await _db.CommitAsync();
                throw;
            }
            catch (Exception exception)
            {
                stopwatch.Stop();
                occurrence.Status = TickerStatus.Failed;
                occurrence.ElapsedTime = stopwatch.ElapsedMilliseconds;
                occurrence.ExceptionMessage = exception.Message;
                occurrence.UpdatedAt = DateTime.UtcNow;
                _occurrenceRepo.Update(occurrence);
                await _db.CommitAsync();
                throw;
            }
        }
    }
}

