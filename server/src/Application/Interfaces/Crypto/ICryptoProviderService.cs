using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.FileStorage;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Audex.Application.Interfaces.Crypto
{
    public interface ICryptoProviderService
    {
        Task<IEnumerable<CryptoProviderDto>> GetAllAsync(bool onlyActive = false);
        Task<CryptoProviderDto> AddAsync(CryptoProviderDto cryptoProvider, IFormFile cryptoProviderIcon = null);
        Task<CryptoProviderDto> UpdateAsync(CryptoProviderDto cryptoProvider, IFormFile cryptoProviderIcon = null);
        Task DeleteAsync(Guid id);
        Task<FileStreamDto> GetIconStreamAsync(string iconKey);
        Task<string> GetIconUrlAsync(string iconKey);
    }
}