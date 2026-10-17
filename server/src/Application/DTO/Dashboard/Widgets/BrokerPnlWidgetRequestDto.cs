#nullable enable
using System;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class BrokerPnlWidgetRequestDto
    {
        public Guid DashboardId { get; set; }

        public string WidgetId { get; set; } = string.Empty;

        public Guid? BrokerAccountId { get; set; }
    }
}
