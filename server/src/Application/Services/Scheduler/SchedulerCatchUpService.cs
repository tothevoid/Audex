using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Utilities.Scheduler;

namespace Audex.Application.Services.Scheduler
{
    public class SchedulerCatchUpService : ISchedulerCatchUpService
    {
        private readonly ISchedulerTaskService _schedulerTaskService;
        private readonly IScheduledJobRegistry _jobRegistry;
        private readonly IScheduleExecutor _scheduleExecutor;
        private readonly ILogger<SchedulerCatchUpService> _logger;

        public SchedulerCatchUpService(
            ISchedulerTaskService schedulerTaskService,
            IScheduledJobRegistry jobRegistry,
            IScheduleExecutor scheduleExecutor,
            ILogger<SchedulerCatchUpService> logger)
        {
            _schedulerTaskService = schedulerTaskService;
            _jobRegistry = jobRegistry;
            _scheduleExecutor = scheduleExecutor;
            _logger = logger;
        }

        public async Task ProcessMissedTasksAsync(CancellationToken cancellationToken = default)
        {
            var currentUtcTime = DateTime.UtcNow;
            _logger.LogInformation("Checking for missed scheduled tasks at startup (Current UTC: {CurrentUtcTime})...", currentUtcTime);

            var activeTasks = (await _schedulerTaskService.GetActiveTasksAsync()).ToList();
            _logger.LogInformation("Found {ActiveTaskCount} active scheduled task(s) to evaluate for startup catch-up.", activeTasks.Count);

            var executedCatchUpCount = 0;

            foreach (var task in activeTasks)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    _logger.LogWarning("Catch-up processing was cancelled before evaluating remaining tasks.");
                    break;
                }

                if (string.IsNullOrWhiteSpace(task.TaskName) || string.IsNullOrWhiteSpace(task.CronExpression))
                {
                    _logger.LogDebug("Skipping task with missing name or cron expression.");
                    continue;
                }

                if (!_jobRegistry.TryGetDescriptor(task.TaskName, out var descriptor))
                {
                    _logger.LogDebug("Task '{TaskName}' has no registered descriptor in JobRegistry. Skipping.", task.TaskName);
                    continue;
                }

                if (!descriptor.AllowStartupCatchUp)
                {
                    _logger.LogDebug("Task '{TaskName}' does not have AllowStartupCatchUp enabled. Skipping.", task.TaskName);
                    continue;
                }

                var lastScheduledExecutionUtc = CronExpressionHelper.GetLastExecutionUtc(task.CronExpression, currentUtcTime);
                if (!lastScheduledExecutionUtc.HasValue)
                {
                    _logger.LogWarning("Unable to calculate last scheduled execution time for task '{TaskName}' with expression '{CronExpression}'.", task.TaskName, task.CronExpression);
                    continue;
                }

                if (task.LastExecutionStatus == ScheduledTaskExecutionStatus.InProgress)
                {
                    _logger.LogInformation("Task '{TaskName}' is already in progress. Skipping catch-up execution.", task.TaskName);
                    continue;
                }

                bool wasMissed = !task.LastExecutionUtc.HasValue || task.LastExecutionUtc.Value < lastScheduledExecutionUtc.Value;

                if (wasMissed)
                {
                    executedCatchUpCount++;
                    _logger.LogInformation(
                        "Task '{TaskName}' missed its scheduled run at {LastScheduledUtc} (Last execution: {LastExecutionTime}). Executing catch-up run...",
                        task.TaskName,
                        lastScheduledExecutionUtc.Value,
                        task.LastExecutionUtc.HasValue ? task.LastExecutionUtc.Value.ToString("o") : "Never");

                    try
                    {
                        await _scheduleExecutor.ExecuteJobAsync(
                            taskName: task.TaskName,
                            triggerSource: ScheduledTaskTriggerSource.Scheduled,
                            cancellationToken: cancellationToken);

                        _logger.LogInformation("Catch-up run for task '{TaskName}' completed successfully.", task.TaskName);
                    }
                    catch (Exception exception)
                    {
                        _logger.LogError(exception, "Catch-up run for task '{TaskName}' failed.", task.TaskName);
                    }
                }
                else
                {
                    _logger.LogInformation(
                        "Task '{TaskName}' is up-to-date (Last execution: {LastExecutionTime}, Last scheduled: {LastScheduledUtc}). Catch-up not required.",
                        task.TaskName,
                        task.LastExecutionUtc.Value.ToString("o"),
                        lastScheduledExecutionUtc.Value);
                }
            }

            _logger.LogInformation(
                "Completed missed tasks check. Executed catch-up for {ExecutedCount} task(s).",
                executedCatchUpCount);
        }
    }
}
