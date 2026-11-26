using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.FileStorage;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Banks
{
    public interface IBankService
    {
        Task<IEnumerable<BankDto>> GetAllAsync(bool onlyActive = false);
        Task<BankDto> GetByIdAsync(Guid id);
        Task<BankDto> AddAsync(BankDto bankDto, IFormFile bankIcon);
        Task<BankDto> UpdateAsync(BankDto bankDto, IFormFile bankIcon);
        Task<bool> DeleteAsync(Guid id);
        Task<FileStreamDto> GetIconStreamAsync(string iconKey);
        Task<string> GetIconUrlAsync(string iconKey);
    }
}