using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Auth;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Jobs;
using Xunit;

namespace Audex.Application.Tests.Jobs
{
    [Trait("Category", "Auth")]
    public class CleanUpExpiredRefreshTokensJobTests : TestBase
    {
        public CleanUpExpiredRefreshTokensJobTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestCleanUpExpiredRefreshTokens_ExecutesSuccessfully()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var job = sp.GetRequiredService<CleanUpExpiredRefreshTokensJob>();

                await job.ExecuteAsync(triggerSource: ScheduledTaskTriggerSource.Manual);
            });
        }
    }
}
