using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Entities.Scheduler;
using Xunit;

namespace Audex.Application.Tests.Services.Scheduler
{
    public class ScheduleExecutorTests : TestBase
    {
        public ScheduleExecutorTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task ExecuteJobAsync_UnknownTask_ThrowsArgumentException()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var executor = sp.GetRequiredService<IScheduleExecutor>();

                await Assert.ThrowsAsync<ArgumentException>(() => executor.ExecuteJobAsync("NonExistentTask"));
            });
        }

        [Fact]
        public async Task ExecuteJobAsync_UnregisteredTaskInDb_ThrowsInvalidOperationException()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var executor = sp.GetRequiredService<IScheduleExecutor>();
                var taskService = sp.GetRequiredService<ISchedulerTaskService>();

                await taskService.DeleteTaskAsync("CleanUpExpiredRefreshTokens");

                await Assert.ThrowsAsync<InvalidOperationException>(() =>
                    executor.ExecuteJobAsync("CleanUpExpiredRefreshTokens", triggerSource: ScheduledTaskTriggerSource.Manual));
            });
        }

        [Fact]
        public async Task ExecuteJobAsync_RegisteredJob_ExecutesSuccessfully()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var executor = sp.GetRequiredService<IScheduleExecutor>();
                var taskService = sp.GetRequiredService<ISchedulerTaskService>();

                // Create the task
                await taskService.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "CleanUpExpiredRefreshTokens",
                    CronExpression = "0 0 2 * * *",
                    IsEnabled = true
                });

                await executor.ExecuteJobAsync("CleanUpExpiredRefreshTokens", triggerSource: ScheduledTaskTriggerSource.Manual);
            });
        }
    }
}
