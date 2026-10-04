#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Common;
using Audex.Application.Integrations.Crypto.Model;
using Audex.Application.Interfaces.Integrations.Crypto;

namespace Audex.Tests.Shared
{
    public class TestCryptoConnector : ICryptoConnector
    {
        public Task<IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>> GetPricesAsync(
            IEnumerable<CryptocurrencyDto> cryptocurrencies,
            CancellationToken cancellationToken = default)
        {
            var rows = (cryptocurrencies ?? Enumerable.Empty<CryptocurrencyDto>())
                .Select(cryptoItem => new CryptoMarketDataRow
                {
                    CryptocurrencyId = cryptoItem.Id,
                    Symbol = cryptoItem.Symbol,
                    PriceUsd = cryptoItem.Price > 0 ? cryptoItem.Price : 50000m,
                    Date = DateTime.UtcNow
                })
                .ToList();

            return Task.FromResult(IntegrationApiResponse<IReadOnlyList<CryptoMarketDataRow>>.Success(rows));
        }

        public Task<IntegrationApiResponse<CryptoCoinInfo>> GetCoinBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return Task.FromResult(IntegrationApiResponse<CryptoCoinInfo>.NotFound(
                    errorCode: LocalizationKeys.Crypto.Errors.SymbolRequired));
            }

            var upper = symbol.Trim().ToUpperInvariant();
            var name = upper switch
            {
                "BTC" => "Bitcoin",
                "ETH" => "Ethereum",
                "SOL" => "Solana",
                "ADA" => "Cardano",
                "DOT" => "Polkadot",
                "AVAX" => "Avalanche",
                "TON" => "Toncoin",
                _ => $"{upper} Coin"
            };

            var price = upper switch
            {
                "BTC" => 65000m,
                "ETH" => 3500m,
                "SOL" => 150m,
                "ADA" => 0.5m,
                "DOT" => 7m,
                "AVAX" => 30m,
                _ => 100m
            };

            return Task.FromResult(IntegrationApiResponse<CryptoCoinInfo>.Success(new CryptoCoinInfo
            {
                Name = name,
                PriceUsd = price
            }));
        }
    }
}
