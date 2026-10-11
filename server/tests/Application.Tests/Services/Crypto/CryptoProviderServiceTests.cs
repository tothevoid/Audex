using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.DTO.Crypto;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Audex.Application.Tests.Services.Crypto
{
    public class CryptoProviderServiceTests : TestBase
    {
        public CryptoProviderServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestAddAndGetAll()
        {
            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.AddAsync(new CryptoProviderDto
                {
                    Name = "Binance"
                }, null);
            });

            Assert.NotNull(added);
            Assert.NotEqual(Guid.Empty, added.Id);

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.GetAllAsync();
            });

            Assert.NotNull(all);
            Assert.Contains(all, p => p.Id == added.Id && p.Name == "Binance");
        }

        [Fact]
        public async Task TestUpdate()
        {
            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.AddAsync(new CryptoProviderDto
                {
                    Name = "Bybit Initial"
                }, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                await service.UpdateAsync(new CryptoProviderDto
                {
                    Id = added.Id,
                    Name = "Bybit Updated"
                }, null);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(p => p.Id == added.Id);
            Assert.NotNull(updated);
            Assert.Equal("Bybit Updated", updated.Name);
        }

        [Fact]
        public async Task TestDelete()
        {
            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.AddAsync(new CryptoProviderDto
                {
                    Name = "Bybit Initial"
                }, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                await service.DeleteAsync(added.Id);
            });

            var listAfterDelete = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(listAfterDelete, p => p.Id == added.Id);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestDelete_WithIcon()
        {
            var providerId = Guid.NewGuid();
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                await service.AddAsync(new CryptoProviderDto
                {
                    Id = providerId,
                    Name = "Provider With Icon",
                    IconKey = "sample-icon-key"
                }, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                await service.DeleteAsync(providerId);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.GetAllAsync();
            });

            Assert.DoesNotContain(all, p => p.Id == providerId);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_RemoveIcon()
        {
            var providerId = Guid.NewGuid();
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                await service.AddAsync(new CryptoProviderDto
                {
                    Id = providerId,
                    Name = "Provider To Remove Icon",
                    IconKey = "initial-icon-key"
                }, null);
            });

            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                await service.UpdateAsync(new CryptoProviderDto
                {
                    Id = providerId,
                    Name = "Provider To Remove Icon",
                    IconKey = null
                }, null);
            });

            var all = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.GetAllAsync();
            });

            var updated = all.FirstOrDefault(p => p.Id == providerId);
            Assert.NotNull(updated);
            Assert.Null(updated.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestAdd_WithIcon_GeneratesVersionedKey()
        {
            var providerId = Guid.NewGuid();
            var formFile = CreateDummyFormFile();

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.AddAsync(new CryptoProviderDto
                {
                    Id = providerId,
                    Name = "Provider Versioned Icon"
                }, formFile);
            });

            Assert.NotNull(added.IconKey);
            Assert.StartsWith(providerId.ToString(), added.IconKey);
            Assert.NotEqual(providerId.ToString(), added.IconKey);
        }

        [Fact]
        [Trait("Category", "S3")]
        public async Task TestUpdate_ReplaceIcon_GeneratesNewKey()
        {
            var providerId = Guid.NewGuid();
            var formFile1 = CreateDummyFormFile();
            var formFile2 = CreateDummyFormFile();

            var added = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.AddAsync(new CryptoProviderDto
                {
                    Id = providerId,
                    Name = "Provider Replace Icon"
                }, formFile1);
            });

            var initialKey = added.IconKey;
            Assert.NotNull(initialKey);

            var updated = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.UpdateAsync(new CryptoProviderDto
                {
                    Id = providerId,
                    Name = "Provider Replace Icon"
                }, formFile2);
            });

            Assert.NotNull(updated.IconKey);
            Assert.NotEqual(initialKey, updated.IconKey);
            Assert.StartsWith(providerId.ToString(), updated.IconKey);

            var iconStream = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<ICryptoProviderService>();
                return await service.GetIconStreamAsync(updated.IconKey);
            });

            Assert.NotNull(iconStream);
            Assert.NotNull(iconStream.Stream);
            Assert.Equal("image/png", iconStream.ContentType);
        }

        private static Microsoft.AspNetCore.Http.IFormFile CreateDummyFormFile()
        {
            var content = Encoding.UTF8.GetBytes("dummy image content");
            return new Microsoft.AspNetCore.Http.FormFile(new MemoryStream(content), 0, content.Length, "icon", "icon.png")
            {
                Headers = new Microsoft.AspNetCore.Http.HeaderDictionary(),
                ContentType = "image/png"
            };
        }
    }
}
