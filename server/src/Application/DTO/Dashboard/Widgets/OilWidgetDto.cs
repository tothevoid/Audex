using System.Collections.Generic;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class OilWidgetDto
    {
        public List<OilQuoteDto> Quotes { get; set; } = new();
    }
}
