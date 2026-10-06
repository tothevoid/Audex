#nullable enable
using System;
using System.Globalization;
using System.Text.Json;

namespace Audex.Application.Utilities
{
    public static class JsonElementExtensions
    {
        public static decimal? TryGetDecimal(this JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var propertyElement))
            {
                return null;
            }

            if (propertyElement.ValueKind == JsonValueKind.Number && propertyElement.TryGetDecimal(out var decimalValue))
            {
                return decimalValue;
            }

            if (propertyElement.ValueKind == JsonValueKind.String)
            {
                return ParsingUtilities.TryGetDecimal(propertyElement.GetString());
            }

            return null;
        }

        public static decimal GetDecimal(this JsonElement element, string propertyName, decimal defaultValue = 0m)
        {
            return TryGetDecimal(element, propertyName) ?? defaultValue;
        }

        public static DateTime? TryGetDateTime(this JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var propertyElement))
            {
                return null;
            }

            if (propertyElement.ValueKind == JsonValueKind.Number && propertyElement.TryGetInt64(out var unixTimestamp))
            {
                return unixTimestamp > 100_000_000_000L
                    ? DateTimeOffset.FromUnixTimeMilliseconds(unixTimestamp).UtcDateTime
                    : DateTimeOffset.FromUnixTimeSeconds(unixTimestamp).UtcDateTime;
            }

            if (propertyElement.ValueKind == JsonValueKind.String)
            {
                return ParsingUtilities.TryGetDateTime(propertyElement.GetString());
            }

            return null;
        }

        public static DateTime GetDateTime(this JsonElement element, string propertyName, DateTime defaultValue = default)
        {
            return TryGetDateTime(element, propertyName) ?? defaultValue;
        }

        public static string? TryGetString(this JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var propertyElement))
            {
                return null;
            }

            if (propertyElement.ValueKind == JsonValueKind.Null || propertyElement.ValueKind == JsonValueKind.Undefined)
            {
                return null;
            }

            if (propertyElement.ValueKind == JsonValueKind.String)
            {
                return propertyElement.GetString();
            }

            return propertyElement.ToString();
        }

        public static string GetString(this JsonElement element, string propertyName, string defaultValue = "")
        {
            var stringValue = TryGetString(element, propertyName);
            return string.IsNullOrEmpty(stringValue) ? defaultValue : stringValue;
        }

        public static int? TryGetInt32(this JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var propertyElement))
            {
                return null;
            }

            if (propertyElement.ValueKind == JsonValueKind.Number && propertyElement.TryGetInt32(out var intValue))
            {
                return intValue;
            }

            if (propertyElement.ValueKind == JsonValueKind.String)
            {
                return ParsingUtilities.TryGetInt32(propertyElement.GetString());
            }

            return null;
        }

        public static int GetInt32(this JsonElement element, string propertyName, int defaultValue = 0)
        {
            return TryGetInt32(element, propertyName) ?? defaultValue;
        }

        public static long? TryGetInt64(this JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var propertyElement))
            {
                return null;
            }

            if (propertyElement.ValueKind == JsonValueKind.Number && propertyElement.TryGetInt64(out var longValue))
            {
                return longValue;
            }

            if (propertyElement.ValueKind == JsonValueKind.String &&
                long.TryParse(propertyElement.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedLong))
            {
                return parsedLong;
            }

            return null;
        }

        public static long GetInt64(this JsonElement element, string propertyName, long defaultValue = 0L)
        {
            return TryGetInt64(element, propertyName) ?? defaultValue;
        }
    }
}
