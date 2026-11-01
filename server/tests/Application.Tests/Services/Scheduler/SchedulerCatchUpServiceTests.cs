using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Database;
using TickerQ.Utilities.Entities;
using TickerQ.Utilities.Enums;
using Xunit;

namespace Audex.Application.Tests.Services.Scheduler
{
    public class SchedulerCatchUpServiceTests : TestBase
    {
        public SchedulerCatchUpServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task ProcessMissedTasksAsync_TaskMissedSchedule_ExecutesCatchUpSuccessfully()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var taskService = serviceProvider.GetRequiredService<ISchedulerTaskService>();
                var catchUpService = serviceProvider.GetRequiredService<ISchedulerCatchUpService>();
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var tickerRepository = unitOfWork.CreateRepository<ScheduledCronTicker>();
                var occurrenceRepository = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();

                await taskService.DeleteTaskAsync("SyncSecurityPricesHistory");

                await taskService.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "SyncSecurityPricesHistory",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                });

                var ticker = await tickerRepository.FindAsync(tickerEntity => tickerEntity.Function == "SyncSecurityPricesHistory", disableTracking: false);
                Assert.NotNull(ticker);

                await catchUpService.ProcessMissedTasksAsync();

                var completedOccurrences = await occurrenceRepository.GetAllAsync(
                    occurrence => occurrence.CronTickerId == ticker.Id && occurrence.Status == TickerStatus.Done);

                Assert.NotEmpty(completedOccurrences);
            });
        }

        [Fact]
        public async Task ProcessMissedTasksAsync_TaskAlreadyRanAfterScheduledTime_DoesNotExecuteAgain()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var taskService = serviceProvider.GetRequiredService<ISchedulerTaskService>();
                var catchUpService = serviceProvider.GetRequiredService<ISchedulerCatchUpService>();
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var tickerRepository = unitOfWork.CreateRepository<ScheduledCronTicker>();
                var occurrenceRepository = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();

                await taskService.DeleteTaskAsync("SyncSecurityPricesHistory");

                await taskService.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "SyncSecurityPricesHistory",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                });

                var ticker = await tickerRepository.FindAsync(tickerEntity => tickerEntity.Function == "SyncSecurityPricesHistory", disableTracking: false);
                Assert.NotNull(ticker);

                // Add an occurrence executed just now (after the last scheduled run)
                var recentOccurrence = new CronTickerOccurrenceEntity<ScheduledCronTicker>
                {
                    Id = Guid.NewGuid(),
                    CronTickerId = ticker.Id,
                    ExecutionTime = DateTime.UtcNow,
                    ExecutedAt = DateTime.UtcNow,
                    ElapsedTime = 50,
                    Status = TickerStatus.Done,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await occurrenceRepository.AddAsync(recentOccurrence);
                await unitOfWork.CommitAsync();

                var countBefore = await occurrenceRepository.GetCountAsync(
                    occurrence => occurrence.CronTickerId == ticker.Id);

                await catchUpService.ProcessMissedTasksAsync();

                var countAfter = await occurrenceRepository.GetCountAsync(
                    occurrence => occurrence.CronTickerId == ticker.Id);

                Assert.Equal(countBefore, countAfter);
            });
        }

        [Fact]
        public async Task ProcessMissedTasksAsync_TaskDisabled_DoesNotExecuteCatchUp()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var taskService = serviceProvider.GetRequiredService<ISchedulerTaskService>();
                var catchUpService = serviceProvider.GetRequiredService<ISchedulerCatchUpService>();
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var tickerRepository = unitOfWork.CreateRepository<ScheduledCronTicker>();
                var occurrenceRepository = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();

                await taskService.DeleteTaskAsync("SyncSecurityPricesHistory");

                await taskService.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "SyncSecurityPricesHistory",
                    CronExpression = "0 0 * * *",
                    IsEnabled = false
                });

                var ticker = await tickerRepository.FindAsync(tickerEntity => tickerEntity.Function == "SyncSecurityPricesHistory", disableTracking: false);
                Assert.NotNull(ticker);

                await catchUpService.ProcessMissedTasksAsync();

                var occurrences = await occurrenceRepository.GetAllAsync(
                    occurrence => occurrence.CronTickerId == ticker.Id && occurrence.Status == TickerStatus.Done);

                Assert.Empty(occurrences);
            });
        }

        [Fact]
        public async Task ProcessMissedTasksAsync_TaskWithoutCatchUpFlag_DoesNotExecuteCatchUp()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var taskService = serviceProvider.GetRequiredService<ISchedulerTaskService>();
                var catchUpService = serviceProvider.GetRequiredService<ISchedulerCatchUpService>();
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var tickerRepository = unitOfWork.CreateRepository<ScheduledCronTicker>();
                var occurrenceRepository = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();

                await taskService.DeleteTaskAsync("CleanUpExpiredRefreshTokens");

                await taskService.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "CleanUpExpiredRefreshTokens",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                });

                var ticker = await tickerRepository.FindAsync(tickerEntity => tickerEntity.Function == "CleanUpExpiredRefreshTokens", disableTracking: false);
                Assert.NotNull(ticker);

                await catchUpService.ProcessMissedTasksAsync();

                var occurrences = await occurrenceRepository.GetAllAsync(
                    occurrence => occurrence.CronTickerId == ticker.Id && occurrence.Status == TickerStatus.Done);

                Assert.Empty(occurrences);
            });
        }
    }
}
