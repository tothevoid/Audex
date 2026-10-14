using Audex.Application.DTO.Crypto;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Crypto
{
    public interface ICryptoAssetService
    {
        Task<IEnumerable<CryptoAssetDto>> GetByCryptoAccountAsync(Guid cryptoAccountId);
        Task<IEnumerable<CryptoAssetDto>> GetAllAsync();
        Task<Guid> AddAsync(CryptoAssetDto cryptoAsset);
        Task UpdateAsync(CryptoAssetDto cryptoAsset);
        Task DeleteAsync(Guid id);
        Task<decimal> GetTotalBalanceAsync();
        Task<decimal> GetTotalBalanceByCryptoAccountAsync(Guid cryptoAccountId);
    }
}
