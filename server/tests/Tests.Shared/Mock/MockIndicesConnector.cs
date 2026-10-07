#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Integrations.Indices;

namespace Audex.Tests.Shared.Mock
{
    public class MockIndicesConnector : IIndicesConnector, IMoexIndicesConnector
    {
        public Func<IEnumerable<string>?, Task<IEnumerable<MarketIndexQuoteDto>>>? GetIndicesQuotesHandler { get; set; }
        public int CallCount { get; private set; }

        public Func<Task<IReadOnlyList<string>>>? GetSupportedIndicesHandler { get; set; }

        public Task<IEnumerable<MarketIndexQuoteDto>> GetIndicesQuotesAsync(IEnumerable<string>? indexCodes = null)
        {
            CallCount++;
            if (GetIndicesQuotesHandler != null)
            {
                return GetIndicesQuotesHandler(indexCodes);
            }

            return Task.FromResult(Enumerable.Empty<MarketIndexQuoteDto>());
        }

        public Task<IReadOnlyList<string>> GetSupportedIndicesAsync()
        {
            if (GetSupportedIndicesHandler != null)
            {
                return GetSupportedIndicesHandler();
            }

            return Task.FromResult<IReadOnlyList<string>>(new List<string> { "IMOEX", "RTSI", "RGBI", "MCFTR" });
        }

        Task<IEnumerable<MarketIndexQuoteDto>> IMoexIndicesConnector.GetIndicesQuotesAsync(IEnumerable<string> indexCodes) =>
            GetIndicesQuotesAsync(indexCodes);
    }
}
