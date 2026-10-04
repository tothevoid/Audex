using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Currencies;
using Audex.Application.DTO.FileStorage;
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
        Task<OperationResultDto<PullCryptoPricesResultDto>> PullPricesAsync(CancellationToken cancellationToken = default);
    }
}