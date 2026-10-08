#nullable enable
using System.Collections.Generic;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class DistributionWidgetDataDto
    {
        public decimal? Total { get; set; }
        public IEnumerable<DistributionDto> Distribution { get; set; } = [];
    }
}
