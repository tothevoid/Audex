using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
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
            await ExecuteScopeAsync(serviceProvider =>
            {
                var registry = serviceProvider.GetRequiredService<IScheduledJobRegistry>();

                var descriptors = registry.GetAllDescriptors();

                Assert.NotNull(descriptors);
                Assert.True(descriptors.Count >= 7);
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "GenerateAllAssetsReport");
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "DatabaseBackup");
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "PullQuotations");
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "CleanUpOldNotifications");
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "CleanUpExpiredRefreshTokens");
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "PullCryptoPrices");
                Assert.Contains(descriptors, descriptor => descriptor.TaskName == "SyncSecurityPricesHistory");
                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task GetDescriptor_ValidTask_ReturnsDescriptor()
        {
            await ExecuteScopeAsync(serviceProvider =>
            {
                var registry = serviceProvider.GetRequiredService<IScheduledJobRegistry>();

                var descriptor = registry.GetDescriptor("GenerateAllAssetsReport");

                Assert.NotNull(descriptor);
                Assert.Equal("GenerateAllAssetsReport", descriptor.TaskName);
                Assert.NotEmpty(descriptor.DisplayNameKey);
                return Task.CompletedTask;
            });
        }

        [Fact]
        public async Task GetDescriptor_SyncSecurityPricesHistory_HasStartupCatchUpEnabled()
        {
            await ExecuteScopeAsync(serviceProvider =>
            {
                var registry = serviceProvider.GetRequiredService<IScheduledJobRegistry>();

                var descriptor = registry.GetDescriptor("SyncSecurityPricesHistory");

                Assert.NotNull(descriptor);
                Assert.Equal("SyncSecurityPricesHistory", descriptor.TaskName);
                Assert.True(descriptor.AllowStartupCatchUp);
                return Task.CompletedTask;
            });
        }
    }
}
