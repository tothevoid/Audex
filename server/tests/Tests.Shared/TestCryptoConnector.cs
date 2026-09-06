using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Crypto;
using Audex.Application.Integrations.Crypto.Model;
using Audex.Application.Interfaces.Integrations.Crypto;

namespace Audex.Tests.Shared
{
    public class TestCryptoConnector : ICryptoConnector
    {
        public Task<IEnumerable<CryptoMarketDataRow>> GetPricesAsync(
            IEnumerable<CryptocurrencyDto> cryptocurrencies,
            CancellationToken cancellationToken = default)
        {
            var rows = (cryptocurrencies ?? Enumerable.Empty<CryptocurrencyDto>())
                .Select(c => new CryptoMarketDataRow
                {
                    CryptocurrencyId = c.Id,
                    Symbol = c.Symbol,
                    PriceUsd = c.Price > 0 ? c.Price : 50000m,
                    Date = DateTime.UtcNow
                });
            return Task.FromResult(rows);
        }

        public Task<(string Name, decimal PriceUsd)?> GetCoinInfoBySymbolAsync(
            string symbol,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return Task.FromResult<(string Name, decimal PriceUsd)?>(null);
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

            return Task.FromResult<(string Name, decimal PriceUsd)?>((name, price));
        }
    }
}
