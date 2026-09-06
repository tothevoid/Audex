using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Tests.Fixtures;
using Xunit;

namespace Audex.Application.Tests.Services.Scheduler
{
    public class ScheduledJobRegistryTests : TestBase
    {
        public ScheduledJobRegistryTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task GetAllDescriptors_ReturnsRegisteredJobs()
        {
            await ExecuteScopeAsync(sp =>
            {
                var registry = sp.GetRequiredService<IScheduledJobRegistry>();

                var descriptors = registry.GetAllDescriptors();

                Assert.NotNull(descriptors);
                Assert.True(descriptors.Count >= 6);
                Assert.Contains(descriptors, d => d.TaskName == "GenerateAllAssetsReport");
                Assert.Contains(descriptors, d => d.TaskName == "DatabaseBackup");
                Assert.Contains(descriptors, d => d.TaskName == "PullQuotations");
                Assert.Contains(descriptors, d => d.TaskName == "CleanUpOldNotifications");
                Assert.Contains(descriptors, d => d.TaskName == "CleanUpExpiredRefreshTokens");
                Assert.Contains(descriptors, d => d.TaskName == "PullCryptoPrices");
                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task GetDescriptor_ValidTask_ReturnsDescriptor()
        {
            await ExecuteScopeAsync(sp =>
            {
                var registry = sp.GetRequiredService<IScheduledJobRegistry>();

                var desc = registry.GetDescriptor("GenerateAllAssetsReport");

                Assert.NotNull(desc);
                Assert.Equal("GenerateAllAssetsReport", desc.TaskName);
                Assert.NotEmpty(desc.DisplayNameKey);
                return Task.CompletedTask;
            });
        }
    }
}
