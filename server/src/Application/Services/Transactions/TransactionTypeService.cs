using System;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Mappings;
using Audex.Infrastructure.Interfaces.Database;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Application.DTO.FileStorage;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.FileStorage;
using Microsoft.AspNetCore.Http;
using Audex.Application.Services.FileStorage;

namespace Audex.Application.Services.Transactions
{
    public class TransactionTypeService: ITransactionTypeService
    {
        private const string _iconsBucket = "transaction-type";

        private readonly IUnitOfWork _db;
        private readonly IRepository<TransactionType> _transactionTypeRepo;
        private readonly ApplicationMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public TransactionTypeService(IUnitOfWork uow, ApplicationMapper mapper, IFileStorageService fileStorageService)
        {
            _db = uow;
            _mapper = mapper;
            _transactionTypeRepo = uow.CreateRepository<TransactionType>();
            _fileStorageService = fileStorageService;
        }

        public async Task<IEnumerable<TransactionTypeDto>> GetAllAsync(bool onlyActive = false)
        {
            var result = onlyActive
                ? await _transactionTypeRepo.GetAllAsync(transaction => transaction.Active)
                : await _transactionTypeRepo.GetAllAsync();
            return _mapper.Map(result.OrderBy(transactionType => transactionType.Name, StringComparer.OrdinalIgnoreCase));
        }

        public async Task<string> GetIconUrlAsync(string iconKey)
        {
            return await _fileStorageService.GetFileUrlAsync(_iconsBucket, iconKey);
        }

        public async Task<TransactionTypeDto> AddAsync(TransactionTypeDto transactionTypeDto, IFormFile transactionTypeIcon)
        {
            var transactionType = _mapper.Map(transactionTypeDto);
            transactionType.Id = Guid.NewGuid();

            if (transactionTypeIcon != null)
            {
                var key = $"{transactionType.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, transactionTypeIcon, key);
                transactionType.IconKey = key;
            }

            await _transactionTypeRepo.AddAsync(transactionType);
            await _db.CommitAsync();
            
            return _mapper.Map(transactionType);
        }

        public async Task<TransactionTypeDto> UpdateAsync(TransactionTypeDto transactionTypeDto, IFormFile transactionTypeIcon)
        {
            var existingTransactionType = await _transactionTypeRepo.GetByIdAsync(transactionTypeDto.Id);
            var transactionType = _mapper.Map(transactionTypeDto);

            if (transactionTypeIcon != null)
            {
                transactionType.IconKey = $"{transactionType.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, transactionTypeIcon, transactionType.IconKey);
            }
            else if (string.IsNullOrEmpty(transactionTypeDto.IconKey))
            {
                transactionType.IconKey = null;
            }

            if (!string.IsNullOrEmpty(existingTransactionType?.IconKey) && existingTransactionType.IconKey != transactionType.IconKey)
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, existingTransactionType.IconKey);
            }

            _transactionTypeRepo.Update(transactionType);
            await _db.CommitAsync();

            return _mapper.Map(transactionType);
        }

        public async Task DeleteAsync(Guid id)
        {
            var transactionType = await _transactionTypeRepo.GetByIdAsync(id);
            if (transactionType != null && !string.IsNullOrEmpty(transactionType.IconKey))
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, transactionType.IconKey);
            }

            await _transactionTypeRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        public async Task<FileStreamDto> GetIconStreamAsync(string iconKey)
        {
            return await _fileStorageService.GetFileStreamAsync(_iconsBucket, iconKey);
        }
    }
}
