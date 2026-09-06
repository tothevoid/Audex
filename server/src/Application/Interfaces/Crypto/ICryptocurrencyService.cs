using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Currencies;
using Audex.Application.DTO.FileStorage;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Audex.Application.Interfaces.Crypto
{
    public interface ICryptocurrencyService
    {
        Task<CurrencyDto> GetBaseCurrencyAsync();
        Task<IEnumerable<CryptocurrencyDto>> GetAllAsync();
        Task<CryptocurrencyDto> AddAsync(CryptocurrencyDto cryptocurrency, IFormFile cryptocurrencyIcon);
        Task<CryptocurrencyDto> UpdateAsync(CryptocurrencyDto cryptocurrency, IFormFile cryptocurrencyIcon);
        Task DeleteAsync(Guid id);
        Task<FileStreamDto> GetIconStreamAsync(string iconKey);
        Task<string> GetIconUrlAsync(string iconKey);
        Task<int> PullPricesAsync(System.Threading.CancellationToken cancellationToken = default);
    }
}