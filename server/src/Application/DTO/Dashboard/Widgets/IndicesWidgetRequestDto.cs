#nullable enable
using System;
using System.Collections.Generic;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class IndicesWidgetRequestDto
    {
        public Guid DashboardId { get; set; }

        public string WidgetId { get; set; } = string.Empty;

        public List<string> Codes { get; set; } = new();
    }
}
