using Audex.Infrastructure.Interfaces.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.FileStorage;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.FileStorage;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Crypto;

namespace Audex.Application.Services.Crypto
{
    public class CryptoProviderService : ICryptoProviderService
    {
        private const string _iconsBucket = "crypto-provider";

        private readonly IUnitOfWork _db;
        private readonly IRepository<CryptoProvider> _cryptoProviderRepo;
        private readonly ApplicationMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public CryptoProviderService(IUnitOfWork uow, ApplicationMapper mapper, IFileStorageService fileStorageService)
        {
            _db = uow;
            _mapper = mapper;
            _cryptoProviderRepo = uow.CreateRepository<CryptoProvider>();
            _fileStorageService = fileStorageService;
        }

        public async Task<IEnumerable<CryptoProviderDto>> GetAllAsync(bool onlyActive = false)
        {
            var cryptoProviders = onlyActive
                ? await _cryptoProviderRepo.GetAllAsync(provider => provider.Active)
                : await _cryptoProviderRepo.GetAllAsync();
            return _mapper.Map(cryptoProviders.OrderBy(provider => provider.Name, StringComparer.OrdinalIgnoreCase));
        }

        public async Task<CryptoProviderDto> AddAsync(CryptoProviderDto cryptoProviderDto, IFormFile cryptoProviderIcon = null)
        {
            var cryptoProvider = _mapper.Map(cryptoProviderDto);
            if (cryptoProvider.Id == Guid.Empty)
            {
                cryptoProvider.Id = Guid.NewGuid();
            }

            if (cryptoProviderIcon != null)
            {
                var key = $"{cryptoProvider.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, cryptoProviderIcon, key);
                cryptoProvider.IconKey = key;
            }

            await _cryptoProviderRepo.AddAsync(cryptoProvider);
            await _db.CommitAsync();
            return _mapper.Map(cryptoProvider);
        }

        public async Task<CryptoProviderDto> UpdateAsync(CryptoProviderDto cryptoProviderDto, IFormFile cryptoProviderIcon = null)
        {
            var existingProvider = await _cryptoProviderRepo.GetByIdAsync(cryptoProviderDto.Id);
            var cryptoProvider = _mapper.Map(cryptoProviderDto);

            if (cryptoProviderIcon != null)
            {
                cryptoProvider.IconKey = $"{cryptoProvider.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, cryptoProviderIcon, cryptoProvider.IconKey);
            }
            else if (string.IsNullOrEmpty(cryptoProviderDto.IconKey))
            {
                cryptoProvider.IconKey = null;
            }

            if (!string.IsNullOrEmpty(existingProvider?.IconKey) && existingProvider.IconKey != cryptoProvider.IconKey)
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, existingProvider.IconKey);
            }

            _cryptoProviderRepo.Update(cryptoProvider);
            await _db.CommitAsync();
            return _mapper.Map(cryptoProvider);
        }

        public async Task DeleteAsync(Guid id)
        {
            var provider = await _cryptoProviderRepo.GetByIdAsync(id);
            if (provider != null && !string.IsNullOrEmpty(provider.IconKey))
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, provider.IconKey);
            }

            await _cryptoProviderRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        public async Task<FileStreamDto> GetIconStreamAsync(string iconKey)
        {
            return await _fileStorageService.GetFileStreamAsync(_iconsBucket, iconKey);
        }

        public async Task<string> GetIconUrlAsync(string iconKey)
        {
            return await _fileStorageService.GetFileUrlAsync(_iconsBucket, iconKey);
        }
    }
}
