#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Integrations.Oil;

namespace Audex.Tests.Shared.Mock
{
    public class MockOilConnector : IOilConnector, IMoexOilConnector, IYahooOilConnector
    {
        public Func<IEnumerable<string>?, Task<IEnumerable<OilQuoteDto>>>? GetOilQuotesHandler { get; set; }
        public int CallCount { get; private set; }

        public Task<IEnumerable<OilQuoteDto>> GetOilQuotesAsync(IEnumerable<string>? oilSymbols = null)
        {
            CallCount++;
            if (GetOilQuotesHandler != null)
            {
                return GetOilQuotesHandler(oilSymbols);
            }

            return Task.FromResult(Enumerable.Empty<OilQuoteDto>());
        }

        Task<IEnumerable<OilQuoteDto>> IMoexOilConnector.GetOilQuotesAsync(IEnumerable<string> oilSymbols) =>
            GetOilQuotesAsync(oilSymbols);

        Task<IEnumerable<OilQuoteDto>> IYahooOilConnector.GetOilQuotesAsync(IEnumerable<string> oilSymbols) =>
            GetOilQuotesAsync(oilSymbols);
    }
}
