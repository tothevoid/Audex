#nullable enable
namespace Audex.Application.Integrations.Crypto.Model
{
    public class CryptoCoinInfo
    {
        public required string Name { get; init; }

        public required decimal PriceUsd { get; init; }
    }
}
