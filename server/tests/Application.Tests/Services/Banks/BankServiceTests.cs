using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Banks;
using Audex.Application.Interfaces.Banks;

namespace Audex.Application.Tests.Services.Banks
{
    public class BankServiceTests : TestBase
    {
        public BankServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetById()
        {
            var bankId = Guid.NewGuid();
            var name = "JPMorgan Chase";
            var bankDto = new BankDto
            {
                Id = bankId,
                Name = name
            };

            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.AddAsync(bankDto, null);
            });

            var fetched = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetByIdAsync(bankId);
            });

            Assert.NotNull(fetched);
            Assert.Equal(bankId, fetched.Id);
            Assert.Equal(name, fetched.Name);
        }

        [Fact]
        public async Task TestGetAll()
        {
            var bankId = Guid.NewGuid();
            var name = "Citigroup";

            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.AddAsync(new BankDto { Id = bankId, Name = name }, null);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, b => b.Id == bankId && b.Name == name);
        }

        [Fact]
        public async Task TestUpdate()
        {
            var bankId = Guid.NewGuid();
            var name = "Goldman";
            var bankDto = new BankDto
            {
                Id = bankId,
                Name = name
            };
            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.AddAsync(bankDto, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.UpdateAsync(new BankDto { Id = bankId, Name = name + " Sachs" }, null);
            });

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetByIdAsync(bankId);
            });

            Assert.NotNull(updated);
            Assert.Equal("Goldman Sachs", updated.Name);
        }

        [Fact]
        public async Task TestDelete()
        {
            var bankId = Guid.NewGuid();
            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.AddAsync(new BankDto { Id = bankId, Name = "Morgan Stanley" }, null);
            });

            var result = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.DeleteAsync(bankId);
            });

            Assert.True(result);

            var deleted = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetByIdAsync(bankId);
            });

            Assert.Null(deleted);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestDelete_WithIcon()
        {
            var bankId = Guid.NewGuid();
            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.AddAsync(new BankDto { Id = bankId, Name = "Bank With Icon", IconKey = "sample-icon-key" }, null);
            });

            var result = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.DeleteAsync(bankId);
            });

            Assert.True(result);

            var deleted = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetByIdAsync(bankId);
            });

            Assert.Null(deleted);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_RemoveIcon()
        {
            var bankId = Guid.NewGuid();
            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.AddAsync(new BankDto { Id = bankId, Name = "Bank To Remove Icon", IconKey = "initial-icon-key" }, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                await bankService.UpdateAsync(new BankDto { Id = bankId, Name = "Bank To Remove Icon", IconKey = null }, null);
            });

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetByIdAsync(bankId);
            });

            Assert.NotNull(updated);
            Assert.Null(updated.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestAdd_WithIcon_GeneratesVersionedKey()
        {
            var bankId = Guid.NewGuid();
            var formFile = CreateDummyFormFile();

            var added = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.AddAsync(new BankDto { Id = bankId, Name = "Bank Versioned Icon" }, formFile);
            });

            Assert.NotNull(added.IconKey);
            Assert.StartsWith(bankId.ToString(), added.IconKey);
            Assert.NotEqual(bankId.ToString(), added.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_ReplaceIcon_GeneratesNewKey()
        {
            var bankId = Guid.NewGuid();
            var formFile1 = CreateDummyFormFile();
            var formFile2 = CreateDummyFormFile();

            var added = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.AddAsync(new BankDto { Id = bankId, Name = "Bank Replace Icon" }, formFile1);
            });

            var initialKey = added.IconKey;
            Assert.NotNull(initialKey);

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.UpdateAsync(new BankDto { Id = bankId, Name = "Bank Replace Icon" }, formFile2);
            });

            Assert.NotNull(updated.IconKey);
            Assert.NotEqual(initialKey, updated.IconKey);
            Assert.StartsWith(bankId.ToString(), updated.IconKey);

            var iconStream = await ExecuteScopeAsync(async sp =>
            {
                var bankService = sp.GetRequiredService<IBankService>();
                return await bankService.GetIconStreamAsync(updated.IconKey);
            });

            Assert.NotNull(iconStream);
            Assert.NotNull(iconStream.Stream);
            Assert.Equal("image/png", iconStream.ContentType);
        }

        private static Microsoft.AspNetCore.Http.IFormFile CreateDummyFormFile()
        {
            var content = System.Text.Encoding.UTF8.GetBytes("dummy image content");
            return new Microsoft.AspNetCore.Http.FormFile(new System.IO.MemoryStream(content), 0, content.Length, "icon", "icon.png")
            {
                Headers = new Microsoft.AspNetCore.Http.HeaderDictionary(),
                ContentType = "image/png"
            };
        }
    }
}
