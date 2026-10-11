using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Interfaces.Securities;

namespace Audex.Application.Tests.Services.Securities
{
    public class PullQuotationsServiceTests : TestBase
    {
        public PullQuotationsServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestUpdateAndGetPullDate()
        {
            var testDate = new DateTime(2026, 8, 3, 12, 0, 0, DateTimeKind.Utc);

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IPullQuotationsService>();
                service.UpdatePullDate(testDate);
                await Task.CompletedTask;
            });

            var pullDate = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IPullQuotationsService>();
                return await Task.FromResult(service.LastPullDate);
            });

            Assert.Equal(testDate, pullDate);
        }
    }
}
