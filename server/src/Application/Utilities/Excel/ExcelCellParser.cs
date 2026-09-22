#nullable enable
using System;
using System.Globalization;
using ClosedXML.Excel;
using Audex.Application.Interfaces.Common;

namespace Audex.Application.Utilities.Excel
{
    public static class ExcelCellParser
    {
        private static readonly string[] DefaultDateTimeFormats = [
            "dd.MM.yyyy HH:mm:ss",
            "dd.MM.yyyy HH:mm",
            "dd.MM.yyyy",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-ddTHH:mm:ss"
        ];

        public static decimal ParseDecimal(
            IXLCell? cell,
            decimal defaultValue = 0m,
            IFormatProvider? formatProvider = null)
        {
            if (cell == null)
            {
                return defaultValue;
            }

            if (cell.DataType == XLDataType.Number)
            {
                return Convert.ToDecimal(cell.GetDouble());
            }

            var text = cell.GetString().Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                return defaultValue;
            }

            var normalizedText = text.Replace(" ", "").Replace("\u00A0", "").Replace(',', '.');
            var provider = formatProvider ?? CultureInfo.InvariantCulture;

            if (decimal.TryParse(normalizedText, NumberStyles.Any, provider, out decimal parsedValue))
            {
                return parsedValue;
            }

            return defaultValue;
        }

        public static int ParseInt(
            IXLCell? cell,
            int defaultValue = 0,
            IFormatProvider? formatProvider = null)
        {
            return (int)Math.Round(ParseDecimal(cell, defaultValue, formatProvider));
        }

        public static (DateTime DateTime, string RawString) ParseDateTime(
            IXLCell? cell,
            TimeZoneInfo timeZone,
            ITimeZoneService timeZoneService,
            IFormatProvider? formatProvider = null,
            string[]? supportedFormats = null)
        {
            if (cell == null)
            {
                return (DateTime.MinValue, string.Empty);
            }

            if (cell.DataType == XLDataType.DateTime)
            {
                var dateTime = cell.GetDateTime();
                return (timeZoneService.ConvertToUtc(dateTime, timeZone), dateTime.ToString("dd.MM.yyyy HH:mm:ss"));
            }

            var cellText = cell.GetString().Trim();
            if (string.IsNullOrWhiteSpace(cellText))
            {
                return (DateTime.MinValue, string.Empty);
            }

            var provider = formatProvider ?? CultureInfo.InvariantCulture;
            var formats = supportedFormats ?? DefaultDateTimeFormats;

            if (DateTime.TryParseExact(cellText, formats, provider, DateTimeStyles.None, out var parsedDateTime))
            {
                return (timeZoneService.ConvertToUtc(parsedDateTime, timeZone), cellText);
            }

            if (DateTime.TryParse(cellText, provider, DateTimeStyles.None, out parsedDateTime))
            {
                return (timeZoneService.ConvertToUtc(parsedDateTime, timeZone), cellText);
            }

            return (DateTime.MinValue, cellText);
        }
    }
}
