#nullable enable
using System;
using System.Collections.Generic;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class OilWidgetRequestDto
    {
        public Guid DashboardId { get; set; }

        public string WidgetId { get; set; } = string.Empty;

        public List<string> Symbols { get; set; } = new();
    }
}
