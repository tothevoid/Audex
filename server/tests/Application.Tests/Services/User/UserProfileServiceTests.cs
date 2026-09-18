using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.User;
using Audex.Application.Interfaces.User;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.User;

namespace Audex.Application.Tests.Services.User
{
    public class UserProfileServiceTests : TestBase
    {
        public UserProfileServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGet_ReturnsSeededUser()
        {
            var user = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(user);
            Assert.NotEqual(Guid.Empty, user.Id);
        }

        [Fact]
        public async Task TestGetByAuth()
        {
            var rawPassword = "TestPassword123!";
            var seededUser = await ExecuteScopeAsync(async sp =>
            {
                var uow = sp.GetRequiredService<Audex.Infrastructure.Interfaces.Database.IUnitOfWork>();
                var repo = uow.CreateRepository<UserProfile>();
                var hasher = sp.GetRequiredService<Audex.Application.Interfaces.Auth.IPasswordHasherService>();
                var user = (await repo.GetAllAsync(disableTracking: false)).First();
                user.Password = hasher.HashPassword(rawPassword);
                repo.Update(user);
                await uow.CommitAsync();

                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(seededUser);

            var authenticated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetByAuthAsync(seededUser.UserName, rawPassword);
            });

            Assert.NotNull(authenticated);
            Assert.Equal(seededUser.Id, authenticated.Id);
        }

        [Fact]
        public async Task TestGetByUserName()
        {
            var seededUser = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(seededUser);

            var found = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetByUserNameAsync(seededUser.UserName);
            });

            Assert.NotNull(found);
            Assert.Equal(seededUser.Id, found.Id);

            var nonExistent = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetByUserNameAsync("non_existent_username_12345");
            });

            Assert.Null(nonExistent);
        }

        [Fact]
        public async Task TestUpdate_ModifiesUserProfile()
        {
            var current = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(current);

            var updateDto = new UserProfileDto
            {
                Id = current.Id,
                UserName = current.UserName,
                LanguageCode = "en-US",
                CurrencyId = CurrencyConstants.USD
            };

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                await service.UpdateAsync(updateDto);
            });

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(updated);
            Assert.Equal("en-US", updated.LanguageCode);
            Assert.Equal(CurrencyConstants.USD, updated.CurrencyId);
            Assert.Equal(current.UserName, updated.UserName);
            Assert.Equal(current.Password, updated.Password);
        }

        [Fact]
        public async Task TestUpdatePassword_UpdatesUserPassword()
        {
            var current = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(current);

            var newHashedPassword = "HashedPasswordTest_" + Guid.NewGuid().ToString("N");

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                await service.UpdatePasswordAsync(current.Id, newHashedPassword);
            });

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IUserProfileService>();
                return await service.GetAsync();
            });

            Assert.NotNull(updated);
            Assert.Equal(newHashedPassword, updated.Password);
        }
    }
}
