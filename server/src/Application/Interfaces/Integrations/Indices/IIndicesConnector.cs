#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;

namespace Audex.Application.Interfaces.Integrations.Indices
{
    public interface IIndicesConnector
    {
        Task<IEnumerable<MarketIndexQuoteDto>> GetIndicesQuotesAsync(IEnumerable<string>? indexCodes = null);

        Task<IReadOnlyList<string>> GetSupportedIndicesAsync();
    }
}
