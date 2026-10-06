#nullable enable
using System;
using System.Collections.Generic;

namespace Audex.Application.Utilities
{
    public static class TabularDataExtensions
    {
        public static decimal? TryGetDecimal(this IReadOnlyList<object?>? row, int columnIndex)
        {
            if (row == null || columnIndex < 0 || columnIndex >= row.Count)
            {
                return null;
            }

            return ParsingUtilities.TryGetDecimal(row[columnIndex]);
        }

        public static decimal GetDecimal(this IReadOnlyList<object?>? row, int columnIndex, decimal defaultValue = 0m)
        {
            return TryGetDecimal(row, columnIndex) ?? defaultValue;
        }

        public static string? TryGetString(this IReadOnlyList<object?>? row, int columnIndex)
        {
            if (row == null || columnIndex < 0 || columnIndex >= row.Count)
            {
                return null;
            }

            return ParsingUtilities.TryGetString(row[columnIndex]);
        }

        public static string GetString(this IReadOnlyList<object?>? row, int columnIndex, string defaultValue = "")
        {
            return TryGetString(row, columnIndex) ?? defaultValue;
        }

        public static DateTime? TryGetDateTime(this IReadOnlyList<object?>? row, int columnIndex)
        {
            if (row == null || columnIndex < 0 || columnIndex >= row.Count)
            {
                return null;
            }

            return ParsingUtilities.TryGetDateTime(row[columnIndex]);
        }

        public static DateTime GetDateTime(this IReadOnlyList<object?>? row, int columnIndex, DateTime defaultValue = default)
        {
            return TryGetDateTime(row, columnIndex) ?? defaultValue;
        }

        public static DateOnly? TryGetDateOnly(this IReadOnlyList<object?>? row, int columnIndex)
        {
            if (row == null || columnIndex < 0 || columnIndex >= row.Count)
            {
                return null;
            }

            return ParsingUtilities.TryGetDateOnly(row[columnIndex]);
        }

        public static DateOnly GetDateOnly(this IReadOnlyList<object?>? row, int columnIndex, DateOnly defaultValue = default)
        {
            return TryGetDateOnly(row, columnIndex) ?? defaultValue;
        }

        public static int? TryGetInt32(this IReadOnlyList<object?>? row, int columnIndex)
        {
            if (row == null || columnIndex < 0 || columnIndex >= row.Count)
            {
                return null;
            }

            return ParsingUtilities.TryGetInt32(row[columnIndex]);
        }

        public static int GetInt32(this IReadOnlyList<object?>? row, int columnIndex, int defaultValue = 0)
        {
            return TryGetInt32(row, columnIndex) ?? defaultValue;
        }
    }
}
