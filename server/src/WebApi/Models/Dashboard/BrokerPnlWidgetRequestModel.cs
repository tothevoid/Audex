#nullable enable
using System;

namespace Audex.WebApi.Models.Dashboard
{
    public class BrokerPnlWidgetRequestModel
    {
        public Guid DashboardId { get; set; }

        public string WidgetId { get; set; } = string.Empty;

        public Guid? BrokerAccountId { get; set; }
    }
}
