using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Entities.Scheduler;
using TickerQ.Utilities.Entities;
using TickerQ.Utilities.Enums;
using Xunit;

namespace Audex.Application.Tests.Services.Scheduler
{
    public class SchedulerTaskServiceTests : TestBase
    {
        public SchedulerTaskServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task GetNotScheduledTasksAsync_ReturnsUnscheduledJobs()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                await service.DeleteTaskAsync("PullCryptoPrices");

                var definitions = await service.GetNotScheduledTasksAsync();

                Assert.NotNull(definitions);
                var list = definitions.ToList();
                Assert.True(list.Count >= 4);
                Assert.Contains(list, d => d.TaskName == "PullCryptoPrices");
            });
        }

        [Fact]
        public async Task CreateTaskAsync_ValidRequest_CreatesTaskSuccessfully()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                // Ensure clean state
                await service.DeleteTaskAsync("GenerateAllAssetsReport");

                var createDto = new CreateScheduledTaskDto
                {
                    TaskName = "GenerateAllAssetsReport",
                    CronExpression = "0 9 * * 1",
                    IsEnabled = true
                };

                var created = await service.CreateTaskAsync(createDto);

                Assert.NotNull(created);
                Assert.Equal("GenerateAllAssetsReport", created.TaskName);
                Assert.NotEmpty(created.DisplayName);
                Assert.NotEmpty(created.Description);
                Assert.Equal("0 9 * * 1", created.CronExpression);
                Assert.True(created.IsEnabled);

                var fetched = await service.GetTaskByNameAsync("GenerateAllAssetsReport");
                Assert.NotNull(fetched);
                Assert.Equal("GenerateAllAssetsReport", fetched.TaskName);
            });
        }

        [Fact]
        public async Task CreateTaskAsync_DuplicateTask_ThrowsInvalidOperationException()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                // Ensure task is created first
                await service.DeleteTaskAsync("DatabaseBackup");
                await service.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "DatabaseBackup",
                    CronExpression = "0 3 * * 0",
                    IsEnabled = true
                });

                // Attempt to create duplicate
                var duplicateDto = new CreateScheduledTaskDto
                {
                    TaskName = "DatabaseBackup",
                    CronExpression = "0 4 * * 0",
                    IsEnabled = false
                };

                await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateTaskAsync(duplicateDto));

                // Clean up
                await service.DeleteTaskAsync("DatabaseBackup");
            });
        }

        [Fact]
        public async Task CreateTaskAsync_InvalidCron_ThrowsArgumentException()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                var invalidDto = new CreateScheduledTaskDto
                {
                    TaskName = "PullQuotations",
                    CronExpression = "*/99 * * * *",
                    IsEnabled = true
                };

                await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTaskAsync(invalidDto));
            });
        }

        [Fact]
        public async Task CreateTaskAsync_UnknownTaskName_ThrowsArgumentException()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                var unknownDto = new CreateScheduledTaskDto
                {
                    TaskName = "NonExistentJob",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                };

                await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTaskAsync(unknownDto));
            });
        }

        [Fact]
        public async Task DeleteTaskAsync_ExistingTask_RemovesTask()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                await service.DeleteTaskAsync("CleanUpOldNotifications");
                await service.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "CleanUpOldNotifications",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                });

                var deleted = await service.DeleteTaskAsync("CleanUpOldNotifications");
                Assert.True(deleted);

                var task = await service.GetTaskByNameAsync("CleanUpOldNotifications");
                Assert.Null(task);
            });
        }

        [Fact]
        public async Task UpdateScheduleAsync_ValidDto_UpdatesTask()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                await service.DeleteTaskAsync("GenerateAllAssetsReport");
                await service.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "GenerateAllAssetsReport",
                    CronExpression = "0 9 * * 1",
                    IsEnabled = true
                });

                var updateDto = new UpdateScheduleDto
                {
                    CronExpression = "0 10 * * 2",
                    IsEnabled = false
                };

                var updated = await service.UpdateScheduleAsync("GenerateAllAssetsReport", updateDto);
                Assert.True(updated);

                var taskInDb = await service.GetTaskByNameAsync("GenerateAllAssetsReport");
                Assert.NotNull(taskInDb);
                Assert.Equal("0 10 * * 2", taskInDb.CronExpression);
                Assert.False(taskInDb.IsEnabled);
            });
        }

        [Fact]
        public async Task ToggleTaskStatusAsync_TogglesEnabledState()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();

                await service.DeleteTaskAsync("CleanUpExpiredRefreshTokens");
                await service.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "CleanUpExpiredRefreshTokens",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                });

                var updated = await service.ToggleTaskStatusAsync("CleanUpExpiredRefreshTokens", false);
                Assert.True(updated);
                var taskInDb = await service.GetTaskByNameAsync("CleanUpExpiredRefreshTokens");
                Assert.NotNull(taskInDb);
                Assert.False(taskInDb.IsEnabled);

                var reEnabled = await service.ToggleTaskStatusAsync("CleanUpExpiredRefreshTokens", true);
                Assert.True(reEnabled);
                taskInDb = await service.GetTaskByNameAsync("CleanUpExpiredRefreshTokens");
                Assert.NotNull(taskInDb);
                Assert.True(taskInDb.IsEnabled);
            });
        }

        [Fact]
        public async Task Test_ScheduledTasks_Localization_RussianAndEnglish()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();
                var userService = sp.GetRequiredService<Audex.Application.Interfaces.User.IUserProfileService>();

                await service.DeleteTaskAsync("GenerateAllAssetsReport");

                // 1. Russian
                await userService.UpdateAsync(new Audex.Application.DTO.User.UserProfileDto
                {
                    Id = Audex.Infrastructure.Constants.UserProfileConstants.UserProfileId,
                    LanguageCode = "ru-RU"
                });

                var ruTasks = await service.GetNotScheduledTasksAsync();
                var ruReport = ruTasks.FirstOrDefault(t => t.TaskName == "GenerateAllAssetsReport");
                Assert.NotNull(ruReport);
                Assert.Equal("Отчет по всем активам (Excel)", ruReport.DisplayName);
                Assert.Equal("Автоматическая генерация Excel-выписки по всем счетам, активам и долгам", ruReport.Description);
                Assert.Equal("Отчеты", ruReport.Category);

                // 2. English
                await userService.UpdateAsync(new Audex.Application.DTO.User.UserProfileDto
                {
                    Id = Audex.Infrastructure.Constants.UserProfileConstants.UserProfileId,
                    LanguageCode = "en-US"
                });

                var enTasks = await service.GetNotScheduledTasksAsync();
                var enReport = enTasks.FirstOrDefault(t => t.TaskName == "GenerateAllAssetsReport");
                Assert.NotNull(enReport);
                Assert.Equal("All Assets Report (Excel)", enReport.DisplayName);
                Assert.Equal("Automatically generate Excel statement for all accounts, assets and debts", enReport.Description);
                Assert.Equal("Reports", enReport.Category);
            });
        }

        [Fact]
        public async Task GetTaskByNameAsync_WithPastExecutionAndQueuedNextRun_ReturnsPastExecutionAsLastRun()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ISchedulerTaskService>();
                var db = sp.GetRequiredService<Audex.Infrastructure.Interfaces.Database.IUnitOfWork>();
                var tickerRepo = db.CreateRepository<ScheduledCronTicker>();
                var occurrenceRepo = db.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();

                await service.DeleteTaskAsync("DatabaseBackup");
                await service.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "DatabaseBackup",
                    CronExpression = "0 3 * * 0",
                    IsEnabled = true
                });

                var ticker = await tickerRepo.FindAsync(t => t.Function == "DatabaseBackup");
                Assert.NotNull(ticker);

                var pastExecutedAt = DateTime.UtcNow.AddMinutes(-30);
                var completedOccurrence = new CronTickerOccurrenceEntity<ScheduledCronTicker>
                {
                    Id = Guid.NewGuid(),
                    CronTickerId = ticker.Id,
                    ExecutionTime = pastExecutedAt,
                    ExecutedAt = pastExecutedAt,
                    ElapsedTime = 420,
                    Status = TickerStatus.Done,
                    CreatedAt = pastExecutedAt,
                    UpdatedAt = pastExecutedAt
                };

                var futureExecutionTime = DateTime.UtcNow.AddHours(2);
                var queuedOccurrence = new CronTickerOccurrenceEntity<ScheduledCronTicker>
                {
                    Id = Guid.NewGuid(),
                    CronTickerId = ticker.Id,
                    ExecutionTime = futureExecutionTime,
                    ExecutedAt = null,
                    ElapsedTime = 0,
                    Status = TickerStatus.Queued,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await occurrenceRepo.AddAsync(completedOccurrence);
                await occurrenceRepo.AddAsync(queuedOccurrence);
                await db.CommitAsync();

                var task = await service.GetTaskByNameAsync("DatabaseBackup");
                Assert.NotNull(task);
                Assert.NotNull(task.LastExecutionUtc);
                Assert.Equal(pastExecutedAt, task.LastExecutionUtc.Value, TimeSpan.FromSeconds(1));
                Assert.Equal(ScheduledTaskExecutionStatus.Done, task.LastExecutionStatus);
                Assert.Equal(420, task.LastExecutionDurationMs);

                // Clean up
                await service.DeleteTaskAsync("DatabaseBackup");
            });
        }
    }
}
