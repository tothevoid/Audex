#nullable enable
using System.Text.Json;

namespace Audex.Application.DTO.Dashboard.Widgets
{
    public class DashboardWidgetDto
    {
        private static readonly JsonSerializerOptions DefaultOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public string Id { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public int RefreshIntervalSeconds { get; set; }

        public DashboardWidgetGridDto Grid { get; set; } = new();

        public JsonElement Settings { get; set; }

        public TSettings? GetSettings<TSettings>(JsonSerializerOptions? serializerOptions = null)
            where TSettings : class
        {
            if (Settings.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return Settings.Deserialize<TSettings>(serializerOptions ?? DefaultOptions);
        }
    }

    public class DashboardWidgetGridDto
    {
        public int X { get; set; }

        public int Y { get; set; }

        public int W { get; set; }

        public int H { get; set; }

        public int? MinW { get; set; }

        public int? MinH { get; set; }

        public int? MaxW { get; set; }

        public int? MaxH { get; set; }
    }
}
