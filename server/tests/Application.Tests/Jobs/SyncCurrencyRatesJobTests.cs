using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Jobs;
using Xunit;

namespace Audex.Application.Tests.Jobs
{
    public class SyncCurrencyRatesJobTests : TestBase
    {
        public SyncCurrencyRatesJobTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestSyncCurrencyRates_ExecutesSuccessfully()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var job = serviceProvider.GetRequiredService<SyncCurrencyRatesJob>();

                await job.ExecuteAsync(triggerSource: ScheduledTaskTriggerSource.Manual);
            });
        }
    }
}

