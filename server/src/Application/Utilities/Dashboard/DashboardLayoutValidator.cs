#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Enums.Dashboard;

namespace Audex.Application.Utilities.Dashboard
{
    public static class DashboardLayoutValidator
    {
        private static readonly JsonSerializerOptions SerializerOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public static List<DashboardWidgetDto> ValidateAndParse(string? layoutJson)
        {
            if (string.IsNullOrWhiteSpace(layoutJson) || layoutJson.Trim() == "[]")
            {
                return new List<DashboardWidgetDto>();
            }

            List<DashboardWidgetDto>? widgets;
            try
            {
                widgets = JsonSerializer.Deserialize<List<DashboardWidgetDto>>(layoutJson, SerializerOptions);
            }
            catch (JsonException jsonException)
            {
                throw new ArgumentException("Dashboard layout must be a valid JSON array of widgets.", nameof(layoutJson), jsonException);
            }

            if (widgets == null)
            {
                return new List<DashboardWidgetDto>();
            }

            foreach (var widget in widgets)
            {
                ValidateWidget(widget);
            }

            return widgets;
        }

        public static DashboardWidgetDto? ExtractWidget(string? layoutJson, string widgetId)
        {
            if (string.IsNullOrWhiteSpace(layoutJson) || string.IsNullOrWhiteSpace(widgetId))
            {
                return null;
            }

            try
            {
                var widgets = JsonSerializer.Deserialize<List<DashboardWidgetDto>>(layoutJson, SerializerOptions);
                return widgets?.FirstOrDefault(widget =>
                    string.Equals(widget.Id, widgetId, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                return null;
            }
        }

        public static TSettings? ExtractWidgetSettings<TSettings>(string? layoutJson, string widgetId)
            where TSettings : class
        {
            var widget = ExtractWidget(layoutJson, widgetId);
            return widget?.GetSettings<TSettings>(SerializerOptions);
        }

        private static void ValidateWidget(DashboardWidgetDto widget)
        {
            if (string.IsNullOrWhiteSpace(widget.Id))
            {
                throw new ArgumentException("Widget identifier cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(widget.Type))
            {
                throw new ArgumentException($"Widget with id '{widget.Id}' must have a valid type specified.");
            }

            if (!Enum.TryParse<DashboardWidgetType>(widget.Type, ignoreCase: true, out var widgetType))
            {
                throw new ArgumentException($"Widget with id '{widget.Id}' has unsupported type '{widget.Type}'.");
            }

            if (widget.Grid == null)
            {
                throw new ArgumentException($"Widget with id '{widget.Id}' must have grid coordinates defined.");
            }

            ValidateWidgetSettingsByType(widget, widgetType);
        }

        private static void ValidateWidgetSettingsByType(DashboardWidgetDto widget, DashboardWidgetType widgetType)
        {
            if (widget.Settings.ValueKind == JsonValueKind.Null ||
                widget.Settings.ValueKind == JsonValueKind.Undefined)
            {
                return;
            }

            if (widget.Settings.ValueKind != JsonValueKind.Object)
            {
                throw new ArgumentException($"Widget with id '{widget.Id}' settings must be a JSON object.");
            }

            switch (widgetType)
            {
                case DashboardWidgetType.Oil:
                    ValidateOilWidgetSettings(widget);
                    break;
            }
        }

        private static void ValidateOilWidgetSettings(DashboardWidgetDto widget)
        {
            try
            {
                var settings = widget.Settings.Deserialize<OilWidgetSettingsDto>(SerializerOptions);
                if (settings == null || settings.Symbols.Count == 0)
                {
                    throw new ArgumentException($"Widget with id '{widget.Id}' must have at least one oil symbol specified in settings.");
                }
            }
            catch (JsonException jsonException)
            {
                throw new ArgumentException(
                    $"Widget with id '{widget.Id}' has malformed Oil settings.", jsonException);
            }
        }
    }
}
