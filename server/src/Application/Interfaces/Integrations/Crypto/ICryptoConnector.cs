using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Crypto.Model;

namespace Audex.Application.Interfaces.Integrations.Crypto
{
    public interface ICryptoConnector
    {
        Task<IEnumerable<CryptoMarketDataRow>> GetPricesAsync(
            IEnumerable<CryptocurrencyDto> cryptocurrencies,
            CancellationToken cancellationToken = default);

        Task<(string Name, decimal PriceUsd)?> GetCoinInfoBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default);
    }
}
