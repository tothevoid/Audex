#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;

namespace Audex.Application.Interfaces.Integrations.Oil
{
    public interface IMoexOilConnector
    {
        Task<IEnumerable<OilQuoteDto>> GetOilQuotesAsync(IEnumerable<string> oilSymbols);
    }
}
