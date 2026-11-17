using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using Audex.Infrastructure.Database;
using Audex.Tests.Shared.Fixtures;
using Xunit;

namespace Audex.Tests.Shared
{
    public abstract class TestBase : IClassFixture<ServiceProviderFixture>
    {
        protected readonly ServiceProviderFixture Fixture;

        protected TestBase(ServiceProviderFixture fixture)
        {
            Fixture = fixture;
        }

        protected async Task ExecuteScopeAsync(Func<IServiceProvider, Task> action)
        {
            if (string.IsNullOrEmpty(CultureInfo.CurrentUICulture.Name) || CultureInfo.CurrentUICulture.Equals(CultureInfo.InvariantCulture))
            {
                CultureInfo.CurrentUICulture = new CultureInfo("ru");
            }

            using var scope = Fixture.ServiceProvider.CreateScope();
            await action(scope.ServiceProvider);
        }

        protected async Task<T> ExecuteScopeAsync<T>(Func<IServiceProvider, Task<T>> action)
        {
            if (string.IsNullOrEmpty(CultureInfo.CurrentUICulture.Name) || CultureInfo.CurrentUICulture.Equals(CultureInfo.InvariantCulture))
            {
                CultureInfo.CurrentUICulture = new CultureInfo("ru");
            }

            using var scope = Fixture.ServiceProvider.CreateScope();
            return await action(scope.ServiceProvider);
        }

        protected ApplicationDbContext CreateDbContext()
        {
            return Fixture.CreateDbContext();
        }
    }
}
