using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Dashboard;
using Audex.Application.Interfaces.Crypto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Audex.Application.Services.Crypto
{
    public class CryptoAccountStatsService : ICryptoAccountStatsService
    {
        private readonly ICryptoAssetService _cryptoAssetService;
        private readonly ICryptocurrencyService _cryptocurrencyService;

        public CryptoAccountStatsService(
            ICryptoAssetService cryptoAssetService,
            ICryptocurrencyService cryptocurrencyService)
        {
            _cryptoAssetService = cryptoAssetService;
            _cryptocurrencyService = cryptocurrencyService;
        }

        public Task<CryptoAccountStatsDto> GetStatsAsync() =>
            BuildStatsAsync(null);

        public Task<CryptoAccountStatsDto> GetStatsByCryptoAccountAsync(Guid cryptoAccountId) =>
            BuildStatsAsync(cryptoAccountId);

        private async Task<CryptoAccountStatsDto> BuildStatsAsync(Guid? cryptoAccountId)
        {
            var items = (cryptoAccountId.HasValue
                ? await _cryptoAssetService.GetByCryptoAccountAsync(cryptoAccountId.Value)
                : await _cryptoAssetService.GetAllAsync()).ToList();

            if (items.Count == 0)
            {
                return new CryptoAccountStatsDto
                {
                    CryptoDistribution = new List<DistributionDto>(),
                    AccountsDistribution = new List<DistributionDto>()
                };
            }

            var baseCurrency = await _cryptocurrencyService.GetBaseCurrencyAsync();
            var baseCurrencyCode = baseCurrency.Name;
            var baseRate = baseCurrency.Rate;

            var cryptoDistribution = CalculateDistribution(
                items,
                asset => asset.Cryptocurrency,
                cryptocurrency => $"{cryptocurrency.Name} ({cryptocurrency.Symbol})",
                baseRate,
                baseCurrencyCode);

            var accountsDistribution = new List<DistributionDto>();

            if (!cryptoAccountId.HasValue)
            {
                accountsDistribution = CalculateDistribution(
                    items,
                    asset => asset.CryptoAccount,
                    account => account.Name,
                    baseRate,
                    baseCurrencyCode);
            }

            return new CryptoAccountStatsDto
            {
                CryptoDistribution = cryptoDistribution,
                AccountsDistribution = accountsDistribution
            };
        }

        private static List<DistributionDto> CalculateDistribution<TKey>(
            IEnumerable<CryptoAssetDto> items,
            Func<CryptoAssetDto, TKey> keySelector,
            Func<TKey, string> nameSelector,
            decimal baseRate,
            string baseCurrencyCode)
        {
            return items
                .GroupBy(keySelector)
                .Select(group =>
                {
                    var amount = group.Sum(asset => asset.Quantity * asset.Cryptocurrency.Price);
                    return new DistributionDto
                    {
                        Name = nameSelector(group.Key),
                        Currency = baseCurrencyCode,
                        Amount = amount,
                        ConvertedAmount = amount * baseRate
                    };
                })
                .OrderByDescending(distribution => distribution.Amount)
                .ToList();
        }
    }
}
