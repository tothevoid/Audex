using Audex.Application.DTO.Crypto;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Crypto;
using Audex.Infrastructure.Interfaces.Database;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Audex.Application.Services.Crypto
{
    public class CryptoAssetService : ICryptoAssetService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<CryptoAsset> _cryptoAssetRepository;
        private readonly ApplicationMapper _mapper;

        public CryptoAssetService(IUnitOfWork unitOfWork, ApplicationMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cryptoAssetRepository = unitOfWork.CreateRepository<CryptoAsset>();
        }

        public async Task<IEnumerable<CryptoAssetDto>> GetByCryptoAccountAsync(Guid cryptoAccountId)
        {
            var cryptoAssets = await _cryptoAssetRepository.GetAllAsync(
                cryptoAsset => cryptoAsset.CryptoAccountId == cryptoAccountId,
                include: GetFullHierarchyColumns);

            return _mapper.Map(cryptoAssets);
        }

        public async Task<IEnumerable<CryptoAssetDto>> GetAllAsync()
        {
            var cryptoAssets = await _cryptoAssetRepository.GetAllAsync(include: GetFullHierarchyColumns);
            return _mapper.Map(cryptoAssets);
        }

        public async Task UpdateAsync(CryptoAssetDto cryptoAssetDto)
        {
            var existingCryptoAsset = await _cryptoAssetRepository.FindAsync(existingAsset =>
                existingAsset.Id != cryptoAssetDto.Id &&
                existingAsset.CryptoAccountId == cryptoAssetDto.CryptoAccountId &&
                existingAsset.CryptocurrencyId == cryptoAssetDto.CryptocurrencyId);

            if (existingCryptoAsset != null)
            {
                throw new InvalidOperationException("This cryptocurrency is already added to the crypto account.");
            }

            var cryptoAsset = _mapper.Map(cryptoAssetDto);
            _cryptoAssetRepository.Update(cryptoAsset);
            await _unitOfWork.CommitAsync();
        }

        public async Task<Guid> AddAsync(CryptoAssetDto cryptoAssetDto)
        {
            var existingCryptoAsset = await _cryptoAssetRepository.FindAsync(existingAsset =>
                existingAsset.CryptoAccountId == cryptoAssetDto.CryptoAccountId &&
                existingAsset.CryptocurrencyId == cryptoAssetDto.CryptocurrencyId);

            if (existingCryptoAsset != null)
            {
                throw new InvalidOperationException("This cryptocurrency is already added to the crypto account.");
            }

            var cryptoAsset = _mapper.Map(cryptoAssetDto);
            cryptoAsset.Id = Guid.NewGuid();
            await _cryptoAssetRepository.AddAsync(cryptoAsset);
            await _unitOfWork.CommitAsync();
            return cryptoAsset.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _cryptoAssetRepository.DeleteAsync(id);
            await _unitOfWork.CommitAsync();
        }

        public async Task<decimal> GetTotalBalanceAsync()
        {
            var items = await _cryptoAssetRepository.GetAllAsync(
                include: GetFullHierarchyColumns);

            return items.Sum(cryptoAsset => cryptoAsset.Quantity * (cryptoAsset.Cryptocurrency != null ? cryptoAsset.Cryptocurrency.Price : 0));
        }

        public async Task<decimal> GetTotalBalanceByCryptoAccountAsync(Guid cryptoAccountId)
        {
            var items = await _cryptoAssetRepository.GetAllAsync(
                cryptoAsset => cryptoAsset.CryptoAccountId == cryptoAccountId,
                include: GetFullHierarchyColumns);

            return items.Sum(cryptoAsset => cryptoAsset.Quantity * (cryptoAsset.Cryptocurrency != null ? cryptoAsset.Cryptocurrency.Price : 0));
        }

        private IQueryable<CryptoAsset> GetFullHierarchyColumns(
            IQueryable<CryptoAsset> cryptoAssetQuery)
        {
            return cryptoAssetQuery
                .Include(cryptoAsset => cryptoAsset.CryptoAccount.CryptoProvider)
                .Include(cryptoAsset => cryptoAsset.Cryptocurrency);
        }
    }
}
