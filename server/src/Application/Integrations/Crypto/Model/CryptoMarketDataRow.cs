using System;

namespace Audex.Application.Integrations.Crypto.Model
{
    public class CryptoMarketDataRow
    {
        public Guid CryptocurrencyId { get; set; }

        public string Symbol { get; set; }

        public decimal PriceUsd { get; set; }

        public DateTime Date { get; set; }
    }
}
