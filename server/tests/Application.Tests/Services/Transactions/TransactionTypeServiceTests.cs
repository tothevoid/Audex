using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Transactions;

namespace Audex.Application.Tests.Services.Transactions
{
    public class TransactionTypeServiceTests : TestBase
    {
        public TransactionTypeServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestGetAll_ReturnsTransactionTypes()
        {
            var types = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetAllAsync(false);
            });

            Assert.NotNull(types);
            Assert.NotEmpty(types);
        }

        [Fact]
        public async Task TestAdd_CreatesTransactionType()
        {
            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "Test Expense",
                Active = true
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, null);
            });

            Assert.NotNull(added);
            Assert.NotEqual(Guid.Empty, added.Id);
            Assert.Equal("Test Expense", added.Name);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetAllAsync(false);
            });

            Assert.Contains(all, t => t.Id == added.Id && t.Name == "Test Expense");
        }

        [Fact]
        public async Task TestUpdate_ModifiesTransactionType()
        {
            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "Original Type",
                Active = true
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, null);
            });

            added.Name = "Updated Type";

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.UpdateAsync(added, null);
            });

            Assert.NotNull(updated);
            Assert.Equal("Updated Type", updated.Name);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetAllAsync(false);
            });

            Assert.Contains(all, t => t.Id == added.Id && t.Name == "Updated Type");
        }

        [Fact]
        public async Task TestDelete_RemovesTransactionType()
        {
            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "To Delete Type",
                Active = true
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                await service.DeleteAsync(added.Id);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetAllAsync(false);
            });

            Assert.DoesNotContain(all, t => t.Id == added.Id);
        }

        [Fact]
        public async Task TestGetAll_OnlyActiveFiltering()
        {
            var activeType = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(new TransactionTypeDto { Name = "Active Type", Active = true }, null);
            });

            var inactiveType = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(new TransactionTypeDto { Name = "Inactive Type", Active = false }, null);
            });

            var onlyActive = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetAllAsync(true);
            });

            Assert.Contains(onlyActive, t => t.Id == activeType.Id);
            Assert.DoesNotContain(onlyActive, t => t.Id == inactiveType.Id);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestDelete_WithIcon()
        {
            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "Type With Icon",
                Active = true,
                IconKey = "type-sample-icon"
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                await service.DeleteAsync(added.Id);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetAllAsync(false);
            });

            Assert.DoesNotContain(all, t => t.Id == added.Id);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_RemoveIcon()
        {
            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "Type To Remove Icon",
                Active = true,
                IconKey = "type-initial-icon"
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, null);
            });

            added.IconKey = null;

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.UpdateAsync(added, null);
            });

            Assert.NotNull(updated);
            Assert.Null(updated.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestAdd_WithIcon_GeneratesVersionedKey()
        {
            var formFile = CreateDummyFormFile();
            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "Type Versioned Icon",
                Active = true
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, formFile);
            });

            Assert.NotNull(added.IconKey);
            Assert.StartsWith(added.Id.ToString(), added.IconKey);
            Assert.NotEqual(added.Id.ToString(), added.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_ReplaceIcon_GeneratesNewKey()
        {
            var formFile1 = CreateDummyFormFile();
            var formFile2 = CreateDummyFormFile();

            var dto = new TransactionTypeDto
            {
                Id = Guid.NewGuid(),
                Name = "Type Replace Icon",
                Active = true
            };

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.AddAsync(dto, formFile1);
            });

            var initialKey = added.IconKey;
            Assert.NotNull(initialKey);

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.UpdateAsync(added, formFile2);
            });

            Assert.NotNull(updated.IconKey);
            Assert.NotEqual(initialKey, updated.IconKey);
            Assert.StartsWith(added.Id.ToString(), updated.IconKey);

            var iconStream = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ITransactionTypeService>();
                return await service.GetIconStreamAsync(updated.IconKey);
            });

            Assert.NotNull(iconStream);
            Assert.NotNull(iconStream.Stream);
            Assert.Equal("image/png", iconStream.ContentType);
        }

        private static Microsoft.AspNetCore.Http.IFormFile CreateDummyFormFile()
        {
            var content = System.Text.Encoding.UTF8.GetBytes("dummy transaction type image");
            return new Microsoft.AspNetCore.Http.FormFile(new System.IO.MemoryStream(content), 0, content.Length, "icon", "icon.png")
            {
                Headers = new Microsoft.AspNetCore.Http.HeaderDictionary(),
                ContentType = "image/png"
            };
        }
    }
}
