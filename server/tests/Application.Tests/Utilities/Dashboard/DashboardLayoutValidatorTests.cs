#nullable enable
using System;
using System.Collections.Generic;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Utilities.Dashboard;
using Xunit;

namespace Audex.Application.Tests.Utilities.Dashboard
{
    public class DashboardLayoutValidatorTests
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("[]")]
        public void ValidateAndParse_WithNullOrEmpty_ReturnsEmptyList(string? layoutJson)
        {
            var result = DashboardLayoutValidator.ValidateAndParse(layoutJson);
            Assert.Empty(result);
        }

        [Fact]
        public void ValidateAndParse_WithValidWidgetsWithoutSettings_ReturnsParsedWidgets()
        {
            const string layoutJson = """
            [
                {
                    "id": "widget-1",
                    "type": "Oil",
                    "title": "Нефть Brent",
                    "refreshIntervalSeconds": 60,
                    "grid": { "x": 0, "y": 0, "w": 6, "h": 4 }
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(layoutJson);

            Assert.Single(widgets);
            Assert.Equal("widget-1", widgets[0].Id);
            Assert.Equal("Oil", widgets[0].Type);
            Assert.Equal("Нефть Brent", widgets[0].Title);
            Assert.Equal(60, widgets[0].RefreshIntervalSeconds);
            Assert.NotNull(widgets[0].Grid);
            Assert.Equal(6, widgets[0].Grid!.W);
        }

        [Fact]
        public void ValidateAndParse_WithValidOilWidgetAndSettings_ReturnsParsedWidgets()
        {
            const string layoutJson = """
            [
                {
                    "id": "oil-1",
                    "type": "Oil",
                    "settings": {
                        "symbols": ["BRENT", "WTI"]
                    }
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(layoutJson);

            Assert.Single(widgets);
            Assert.Equal("oil-1", widgets[0].Id);
            Assert.Equal(System.Text.Json.JsonValueKind.Object, widgets[0].Settings.ValueKind);
        }

        [Fact]
        public void ValidateAndParse_WithInvalidJson_ThrowsArgumentException()
        {
            const string invalidJson = "{ not a valid json array }";

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(invalidJson));

            Assert.Contains("valid JSON array", exception.Message);
        }

        [Fact]
        public void ValidateAndParse_WithMissingWidgetId_ThrowsArgumentException()
        {
            const string missingIdJson = """
            [
                {
                    "id": "",
                    "type": "Oil"
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(missingIdJson));

            Assert.Contains("identifier cannot be empty", exception.Message);
        }

        [Fact]
        public void ValidateAndParse_WithMissingWidgetType_ThrowsArgumentException()
        {
            const string missingTypeJson = """
            [
                {
                    "id": "widget-1",
                    "type": ""
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(missingTypeJson));

            Assert.Contains("must have a valid type", exception.Message);
        }

        [Fact]
        public void ValidateAndParse_WithUnsupportedWidgetType_ThrowsArgumentException()
        {
            const string unknownTypeJson = """
            [
                {
                    "id": "widget-1",
                    "type": "NonExistentWidgetType"
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(unknownTypeJson));

            Assert.Contains("unsupported type", exception.Message);
        }

        [Fact]
        public void ValidateAndParse_WithNullGrid_ThrowsArgumentException()
        {
            const string nullGridJson = """
            [
                {
                    "id": "widget-1",
                    "type": "Oil",
                    "grid": null
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(nullGridJson));

            Assert.Contains("grid coordinates", exception.Message);
        }

        [Fact]
        public void ValidateAndParse_WithNonObjectSettings_ThrowsArgumentException()
        {
            const string nonObjectSettingsJson = """
            [
                {
                    "id": "widget-1",
                    "type": "Oil",
                    "settings": "not an object"
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(nonObjectSettingsJson));

            Assert.Contains("must be a JSON object", exception.Message);
        }

        [Fact]
        public void ValidateAndParse_WithEmptyOilSymbols_ReturnsParsedWidgets()
        {
            const string emptySymbolsJson = """
            [
                {
                    "id": "widget-1",
                    "type": "Oil",
                    "settings": {
                        "symbols": []
                    }
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(emptySymbolsJson);

            Assert.Single(widgets);
            Assert.Equal("widget-1", widgets[0].Id);
        }

        [Fact]
        public void ValidateAndParse_WithEmptySettingsObject_ReturnsParsedWidgets()
        {
            const string emptySettingsJson = """
            [
                {
                    "id": "widget-1",
                    "type": "Oil",
                    "settings": {}
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(emptySettingsJson);

            Assert.Single(widgets);
            Assert.Equal("widget-1", widgets[0].Id);
        }

        [Fact]
        public void ValidateAndParse_WithUnsupportedOilSymbol_ThrowsArgumentException()
        {
            const string unsupportedSymbolJson = """
            [
                {
                    "id": "widget-1",
                    "type": "Oil",
                    "settings": {
                        "symbols": ["UNSUPPORTED_OIL"]
                    }
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(unsupportedSymbolJson));

            Assert.Contains("unsupported Oil items", exception.Message);
        }

        [Fact]
        public void ExtractWidgetSettings_WithValidSettings_DeserializesCorrectly()
        {
            const string layoutJson = """
            [
                {
                    "id": "oil-widget",
                    "type": "Oil",
                    "settings": {
                        "symbols": ["BRENT", "WTI"]
                    }
                }
            ]
            """;

            var settings = DashboardLayoutValidator.ExtractWidgetSettings<OilWidgetSettingsDto>(
                layoutJson,
                "oil-widget");

            Assert.NotNull(settings);
            Assert.NotNull(settings.Symbols);
            Assert.Equal(2, settings.Symbols.Count);
            Assert.Contains("BRENT", settings.Symbols);
            Assert.Contains("WTI", settings.Symbols);
        }

        [Fact]
        public void ExtractWidgetSettings_WithMissingWidgetOrNoSettings_ReturnsNull()
        {
            const string layoutJson = """
            [
                {
                    "id": "oil-widget",
                    "type": "Oil"
                }
            ]
            """;

            var missingWidgetSettings = DashboardLayoutValidator.ExtractWidgetSettings<OilWidgetSettingsDto>(
                layoutJson,
                "non-existent-widget");
            var noSettingsWidget = DashboardLayoutValidator.ExtractWidgetSettings<OilWidgetSettingsDto>(
                layoutJson,
                "oil-widget");

            Assert.Null(missingWidgetSettings);
            Assert.Null(noSettingsWidget);
        }

        [Fact]
        public void GetSettings_DeserializesTypedSettingsDirectly()
        {
            var widget = new DashboardWidgetDto
            {
                Id = "oil-1",
                Type = "Oil",
                Title = "Brent Oil",
                RefreshIntervalSeconds = 30,
                Grid = new DashboardWidgetGridDto { X = 0, Y = 0, W = 6, H = 4 },
                Settings = System.Text.Json.JsonDocument.Parse("""{"symbols": ["BRENT", "WTI"]}""").RootElement
            };

            var settings = widget.GetSettings<OilWidgetSettingsDto>();

            Assert.NotNull(settings);
            Assert.NotNull(settings!.Symbols);
            Assert.Equal(2, settings.Symbols.Count);
            Assert.Contains("BRENT", settings.Symbols);
            Assert.Contains("WTI", settings.Symbols);
        }

        [Fact]
        public void ExtractWidget_ReturnsDashboardWidgetDto()
        {
            const string layoutJson = """
            [
                {
                    "id": "oil-widget",
                    "type": "Oil",
                    "title": "Widget Title",
                    "settings": {
                        "symbols": ["BRENT"]
                    }
                }
            ]
            """;

            var widget = DashboardLayoutValidator.ExtractWidget(
                layoutJson,
                "oil-widget");

            Assert.NotNull(widget);
            Assert.Equal("oil-widget", widget.Id);
            Assert.Equal("Widget Title", widget.Title);

            var settings = widget.GetSettings<OilWidgetSettingsDto>();
            Assert.NotNull(settings);
            Assert.Equal(new List<string> { "BRENT" }, settings!.Symbols);
        }

        [Fact]
        public void ValidateAndParse_WithSecuritiesDailyWidget_ReturnsParsedWidgets()
        {
            const string layoutJson = """
            [
                {
                    "id": "securities-daily-1",
                    "type": "SecuritiesDaily",
                    "title": "Ценные бумаги",
                    "refreshIntervalSeconds": 60,
                    "grid": { "x": 0, "y": 0, "w": 6, "h": 3 },
                    "settings": {}
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(layoutJson);

            Assert.Single(widgets);
            Assert.Equal("securities-daily-1", widgets[0].Id);
            Assert.Equal("SecuritiesDaily", widgets[0].Type);
        }

        [Fact]
        public void ValidateAndParse_WithCurrencyRatesWidget_ReturnsParsedWidgets()
        {
            var layoutJson = """
            [
                {
                    "id": "currency-rates-1",
                    "type": "CurrencyRates",
                    "title": "Курсы валют",
                    "refreshIntervalSeconds": 300,
                    "grid": { "x": 0, "y": 0, "w": 6, "h": 3 },
                    "settings": {}
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(layoutJson);

            Assert.Single(widgets);
            Assert.Equal("currency-rates-1", widgets[0].Id);
            Assert.Equal("CurrencyRates", widgets[0].Type);
        }

        [Fact]
        public void ValidateAndParse_WithIndicesWidget_ValidSettings_ReturnsParsedWidgets()
        {
            const string layoutJson = """
            [
                {
                    "id": "indices-1",
                    "type": "Indices",
                    "title": "Биржевые индексы",
                    "refreshIntervalSeconds": 60,
                    "grid": { "x": 0, "y": 0, "w": 6, "h": 3 },
                    "settings": {
                        "codes": ["IMOEX", "RTSI", "RGBI"]
                    }
                }
            ]
            """;

            var widgets = DashboardLayoutValidator.ValidateAndParse(layoutJson);

            Assert.Single(widgets);
            Assert.Equal("indices-1", widgets[0].Id);
            Assert.Equal("Indices", widgets[0].Type);
        }

        [Fact]
        public void ValidateAndParse_WithIndicesWidget_UnsupportedCodes_ThrowsArgumentException()
        {
            const string layoutJson = """
            [
                {
                    "id": "indices-1",
                    "type": "Indices",
                    "title": "Биржевые индексы",
                    "refreshIntervalSeconds": 60,
                    "grid": { "x": 0, "y": 0, "w": 6, "h": 3 },
                    "settings": {
                        "codes": ["SP500_UNKNOWN"]
                    }
                }
            ]
            """;

            var exception = Assert.Throws<ArgumentException>(() =>
                DashboardLayoutValidator.ValidateAndParse(layoutJson));

            Assert.Contains("unsupported Indices items", exception.Message);
        }
    }
}
