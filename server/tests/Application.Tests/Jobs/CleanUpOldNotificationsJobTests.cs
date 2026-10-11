using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Jobs;
using Xunit;

namespace Audex.Application.Tests.Jobs
{
    public class CleanUpOldNotificationsJobTests : TestBase
    {
        public CleanUpOldNotificationsJobTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestCleanUp_ExecutesSuccessfully()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var job = sp.GetRequiredService<CleanUpOldNotificationsJob>();

                await job.ExecuteAsync(triggerSource: ScheduledTaskTriggerSource.Manual);
            });
        }
    }
}
