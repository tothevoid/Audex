using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.FileStorage;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.FileStorage;
using Audex.Application.Mappings;
using Audex.Application.Services.FileStorage;
using Audex.Infrastructure.Entities.Banks;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Infrastructure.Interfaces.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Audex.Application.Services.Banks
{
    public class BankService : IBankService
    {
        private const string IconsBucket = "bank";

        private readonly IUnitOfWork _db;
        private readonly IRepository<Bank> _bankRepo;
        private readonly ApplicationMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public BankService(IUnitOfWork uow, ApplicationMapper mapper, IFileStorageService fileStorageService)
        {
            _db = uow;
            _mapper = mapper;
            _bankRepo = uow.CreateRepository<Bank>();
            _fileStorageService = fileStorageService;
        }

        public async Task<IEnumerable<BankDto>> GetAllAsync(bool onlyActive = false)
        {
            var banks = onlyActive
                ? await _bankRepo.GetAllAsync(bank => bank.Active)
                : await _bankRepo.GetAllAsync();
            return _mapper.Map(banks.OrderBy(bank => bank.Name, StringComparer.OrdinalIgnoreCase));
        }

        public async Task<BankDto> GetByIdAsync(Guid id)
        {
            var bank = await _bankRepo.GetByIdAsync(id);
            return _mapper.Map(bank);
        }

        public async Task<BankDto> AddAsync(BankDto bankDto, IFormFile bankIcon)
        {
            var bank = _mapper.Map(bankDto);

            if (bankIcon != null)
            {
                var key = $"{bank.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(IconsBucket, bankIcon, key);
                bank.IconKey = key;
            }

            await _bankRepo.AddAsync(bank);
            await _db.CommitAsync();
            return _mapper.Map(bank);
        }

        public async Task<BankDto> UpdateAsync(BankDto bankDto, IFormFile bankIcon)
        {
            var existingBank = await _bankRepo.GetByIdAsync(bankDto.Id);
            var bank = _mapper.Map(bankDto);

            if (bankIcon != null)
            {
                bank.IconKey = $"{bank.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(IconsBucket, bankIcon, bank.IconKey);
            }
            else if (string.IsNullOrEmpty(bankDto.IconKey))
            {
                bank.IconKey = null;
            }

            if (!string.IsNullOrEmpty(existingBank?.IconKey) && existingBank.IconKey != bank.IconKey)
            {
                await _fileStorageService.DeleteFileAsync(IconsBucket, existingBank.IconKey);
            }
            
            _bankRepo.Update(bank);
            await _db.CommitAsync();
            return _mapper.Map(bank);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var bank = await _bankRepo.GetByIdAsync(id);
            if (bank != null && !string.IsNullOrEmpty(bank.IconKey))
            {
                await _fileStorageService.DeleteFileAsync(IconsBucket, bank.IconKey);
            }

            await _bankRepo.DeleteAsync(id);
            await _db.CommitAsync();

            return true;
        }

        public async Task<FileStreamDto> GetIconStreamAsync(string iconKey)
        {
            return await _fileStorageService.GetFileStreamAsync(IconsBucket, iconKey);
        }

        public async Task<string> GetIconUrlAsync(string iconKey)
        {
            return await _fileStorageService.GetFileUrlAsync(IconsBucket, iconKey);
        }
    }
}