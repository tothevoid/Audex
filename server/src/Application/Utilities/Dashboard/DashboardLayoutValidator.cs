#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Enums.Dashboard;
using Audex.Application.Integrations.Indices.Moex;
using Audex.Application.Services.Dashboard.Widgets.Oil;

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
                case DashboardWidgetType.Indices:
                    ValidateIndicesWidgetSettings(widget);
                    break;
            }
        }

        private static void ValidateOilWidgetSettings(DashboardWidgetDto widget)
        {
            ValidateSelectionWidgetSettings<OilWidgetSettingsDto>(
                widget,
                itemsSelector: settings => settings.Symbols,
                isSupportedPredicate: symbol => OilQuotationService.BenchmarkDefinitions.ContainsKey(symbol));
        }

        private static void ValidateIndicesWidgetSettings(DashboardWidgetDto widget)
        {
            var supportedIndexCodes = new HashSet<string>(MoexIndicesConnector.SupportedIndexCodes, StringComparer.OrdinalIgnoreCase);

            ValidateSelectionWidgetSettings<IndicesWidgetSettingsDto>(
                widget,
                itemsSelector: settings => settings.Codes,
                isSupportedPredicate: code => supportedIndexCodes.Contains(code));
        }

        private static void ValidateSelectionWidgetSettings<TSettings>(
            DashboardWidgetDto widget,
            Func<TSettings, IEnumerable<string>?> itemsSelector,
            Func<string, bool> isSupportedPredicate)
            where TSettings : class
        {
            try
            {
                var settings = widget.Settings.Deserialize<TSettings>(SerializerOptions);
                var items = settings != null ? itemsSelector(settings) : null;
                if (items == null)
                {
                    return;
                }

                var unsupportedItems = items
                    .Where(item => !string.IsNullOrWhiteSpace(item))
                    .Select(item => item.Trim())
                    .Where(item => !isSupportedPredicate(item))
                    .ToList();

                if (unsupportedItems.Count > 0)
                {
                    throw new ArgumentException(
                        $"Widget with id '{widget.Id}' contains unsupported {widget.Type} items: {string.Join(", ", unsupportedItems)}.");
                }
            }
            catch (JsonException jsonException)
            {
                throw new ArgumentException(
                    $"Widget with id '{widget.Id}' has malformed {widget.Type} settings.", jsonException);
            }
        }
    }
}
