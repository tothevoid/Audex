using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Accounts;
using Audex.Application.Interfaces.Accounts;

namespace Audex.Application.Tests.Services.Accounts
{
    public class AccountTypeServiceTests: TestBase
    {
        public AccountTypeServiceTests(ServiceProviderFixture serviceProviderFixture): base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAdd()
        {
            var typesBefore = await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var typesBefore = await accountTypeService.GetAllAsync();

                return typesBefore;
            });

            var names = Enumerable.Range(0, 10).Select(x => $"Account: {x}").ToArray();

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                foreach (var name in names)
                {
                    await accountTypeService.AddAsync(new AccountTypeDto() { Active = true, Id = Guid.NewGuid(), Name = name });
                }
            });

            var typesAfter = await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var typesAfter = await accountTypeService.GetAllAsync();

                return typesAfter;
            });

            Assert.Equivalent(typesBefore.Count(), typesAfter.Count() - names.Length);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var nameBefore = "TestBefore";

            var id = Guid.NewGuid();

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var accountType = CreateAccountType(id, nameBefore);
                await accountTypeService.AddAsync(accountType);
            });

            var nameAfter = "TestAfter";

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var accountType = CreateAccountType(id, nameAfter);
                await accountTypeService.UpdateAsync(accountType);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var typesAfter = await accountTypeService.GetAllAsync();

                var accountTypeWithNameBefore = typesAfter.FirstOrDefault(type => type.Name == nameBefore);

                var accountTypeWithNameAfter = typesAfter.FirstOrDefault(type => type.Name == nameAfter);

                Assert.Null(accountTypeWithNameBefore);
                Assert.NotNull(accountTypeWithNameAfter);
            });
        }

        [Fact]
        public async Task TestDelete()
        {
            var id = Guid.NewGuid();

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var accountType = CreateAccountType(id, nameof(TestDelete));
                await accountTypeService.AddAsync(accountType);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                await accountTypeService.DeleteAsync(id);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var accountTypeService = sp.GetRequiredService<IAccountTypeService>();

                var typesAfter = await accountTypeService.GetAllAsync();

                var accountTypesWithSameId = typesAfter.FirstOrDefault(type => type.Id == id);

                Assert.Null(accountTypesWithSameId);
            });
        }

        private AccountTypeDto CreateAccountType(Guid id, string name) => new() { Id = id, Active = true, Name = name };
    }
}
