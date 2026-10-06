#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;

namespace Audex.Application.Utilities
{
    public static class ParsingUtilities
    {
        public static Dictionary<string, int> GetColumnIndexMapping(IEnumerable<string> columns)
        {
            var columnIndexes = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var index = 0;
            foreach (var column in columns)
            {
                columnIndexes[column] = index++;
            }

            return columnIndexes;
        }

        public static decimal? TryGetDecimal(object? value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is decimal decimalValue)
            {
                return decimalValue;
            }

            if (value is double doubleValue)
            {
                return (decimal)doubleValue;
            }

            if (value is float floatValue)
            {
                return (decimal)floatValue;
            }

            if (value is int intValue)
            {
                return intValue;
            }

            if (value is long longValue)
            {
                return longValue;
            }

            var stringValue = Convert.ToString(value, CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(stringValue))
            {
                return null;
            }

            if (decimal.TryParse(stringValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedInvariant))
            {
                return parsedInvariant;
            }

            if (decimal.TryParse(stringValue, NumberStyles.Any, CultureInfo.CurrentCulture, out var parsedCurrent))
            {
                return parsedCurrent;
            }

            return null;
        }

        public static decimal TryGetDecimal(object? value, decimal defaultValue)
        {
            return TryGetDecimal(value) ?? defaultValue;
        }

        public static DateTime? TryGetDateTime(object? value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is DateTime dateTimeValue)
            {
                return dateTimeValue;
            }

            var stringValue = value.ToString();
            if (string.IsNullOrWhiteSpace(stringValue))
            {
                return null;
            }

            if (DateTime.TryParse(stringValue, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var parsedInvariant))
            {
                return parsedInvariant;
            }

            if (DateTime.TryParse(stringValue, CultureInfo.CurrentCulture, DateTimeStyles.AdjustToUniversal, out var parsedCurrent))
            {
                return parsedCurrent;
            }

            return null;
        }

        public static DateTime TryGetDateTime(object? value, DateTime defaultValue)
        {
            return TryGetDateTime(value) ?? defaultValue;
        }

        public static DateOnly? TryGetDateOnly(object? value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is DateOnly dateOnlyValue)
            {
                return dateOnlyValue;
            }

            if (value is DateTime dateTimeValue)
            {
                return DateOnly.FromDateTime(dateTimeValue);
            }

            var stringValue = value.ToString();
            if (string.IsNullOrWhiteSpace(stringValue))
            {
                return null;
            }

            if (DateOnly.TryParse(stringValue, CultureInfo.InvariantCulture, out var parsedInvariant))
            {
                return parsedInvariant;
            }

            if (DateOnly.TryParse(stringValue, CultureInfo.CurrentCulture, out var parsedCurrent))
            {
                return parsedCurrent;
            }

            return null;
        }

        public static DateOnly TryGetDateOnly(object? value, DateOnly defaultValue)
        {
            return TryGetDateOnly(value) ?? defaultValue;
        }

        public static string? TryGetString(object? value)
        {
            if (value == null)
            {
                return null;
            }

            return Convert.ToString(value);
        }

        public static string TryGetString(object? value, string defaultValue)
        {
            return TryGetString(value) ?? defaultValue;
        }

        public static int? TryGetInt32(object? value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is int intValue)
            {
                return intValue;
            }

            if (value is long longValue and >= int.MinValue and <= int.MaxValue)
            {
                return (int)longValue;
            }

            if (value is short shortValue)
            {
                return shortValue;
            }

            if (value is byte byteValue)
            {
                return byteValue;
            }

            var stringValue = Convert.ToString(value, CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(stringValue))
            {
                return null;
            }

            if (int.TryParse(stringValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedInvariant))
            {
                return parsedInvariant;
            }

            if (int.TryParse(stringValue, NumberStyles.Any, CultureInfo.CurrentCulture, out var parsedCurrent))
            {
                return parsedCurrent;
            }

            return null;
        }

        public static int TryGetInt32(object? value, int defaultValue)
        {
            return TryGetInt32(value) ?? defaultValue;
        }
    }
}
