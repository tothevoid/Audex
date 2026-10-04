#nullable enable
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Common;
using Audex.Application.Integrations.Crypto.Model;

namespace Audex.Application.Interfaces.Integrations.Crypto
{
    public interface ICryptoConnector
    {
        Task<IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>> GetPricesAsync(
            IEnumerable<CryptocurrencyDto> cryptocurrencies,
            CancellationToken cancellationToken = default);

        Task<IntegrationApiResponse<CryptoCoinInfo>> GetCoinBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default);
    }
}
