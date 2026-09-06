using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Jobs;
using Audex.Application.Tests.Fixtures;
using Xunit;

namespace Audex.Application.Tests.Jobs
{
    public class PullCryptoPricesJobTests : TestBase
    {
        public PullCryptoPricesJobTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestPullCryptoPrices_ExecutesSuccessfully()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var job = sp.GetRequiredService<PullCryptoPricesJob>();

                await job.ExecuteAsync(triggerSource: ScheduledTaskTriggerSource.Manual);
            });
        }
    }
}
