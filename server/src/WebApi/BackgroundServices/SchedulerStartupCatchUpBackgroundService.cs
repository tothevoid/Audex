using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Audex.Application.Interfaces.Scheduler;

namespace Audex.WebApi.BackgroundServices
{
    public class SchedulerStartupCatchUpBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<SchedulerStartupCatchUpBackgroundService> _logger;
        private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(15);

        public SchedulerStartupCatchUpBackgroundService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<SchedulerStartupCatchUpBackgroundService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var scheduledRunTimeUtc = DateTime.UtcNow.Add(StartupDelay);
            _logger.LogInformation(
                "Scheduler startup catch-up background service initialized. Catch-up check scheduled to run in {DelaySeconds} seconds (at {ScheduledRunTimeUtc:o} UTC).",
                StartupDelay.TotalSeconds,
                scheduledRunTimeUtc);

            try
            {
                await Task.Delay(StartupDelay, stoppingToken);

                _logger.LogInformation("Starting scheduled tasks catch-up processing...");

                using var scope = _serviceScopeFactory.CreateScope();
                var catchUpService = scope.ServiceProvider.GetRequiredService<ISchedulerCatchUpService>();
                await catchUpService.ProcessMissedTasksAsync(stoppingToken);

                _logger.LogInformation("Scheduled tasks catch-up background service completed successfully.");
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Scheduler startup catch-up background service was cancelled due to host shutdown.");
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "An error occurred during scheduler startup catch-up execution.");
            }
        }
    }
}
