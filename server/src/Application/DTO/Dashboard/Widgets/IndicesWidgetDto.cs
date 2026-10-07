#nullable enable
using System.Collections.Generic;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class IndicesWidgetDto
    {
        public List<MarketIndexQuoteDto> Indices { get; set; } = new();
    }
}
