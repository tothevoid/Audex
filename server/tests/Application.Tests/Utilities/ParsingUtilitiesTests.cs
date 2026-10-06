#nullable enable
using System.Collections.Generic;
using Audex.Application.Utilities;
using Xunit;

namespace Audex.Application.Tests.Utilities
{
    public class ParsingUtilitiesTests
    {
        [Fact]
        public void GetColumnIndexMapping_MapsColumnsToIndexesCorrectly()
        {
            var columns = new List<string> { "SECID", "BOARDID", "LAST", "VALTODAY" };

            var result = ParsingUtilities.GetColumnIndexMapping(columns);

            Assert.Equal(4, result.Count);
            Assert.Equal(0, result["SECID"]);
            Assert.Equal(1, result["BOARDID"]);
            Assert.Equal(2, result["LAST"]);
            Assert.Equal(3, result["VALTODAY"]);
            Assert.Equal(0, result["secid"]); // Case-insensitive check
        }

        [Fact]
        public void TryGetDecimal_WithNullOrInvalidValue_ReturnsNull()
        {
            Assert.Null(ParsingUtilities.TryGetDecimal(null));
            Assert.Null(ParsingUtilities.TryGetDecimal(""));
            Assert.Null(ParsingUtilities.TryGetDecimal("not_a_number"));
        }

        [Fact]
        public void TryGetDecimal_WithValidStringOrNumber_ReturnsParsedDecimal()
        {
            Assert.Equal(123.45m, ParsingUtilities.TryGetDecimal("123.45"));
            Assert.Equal(100m, ParsingUtilities.TryGetDecimal(100));
            Assert.Equal(50.5m, ParsingUtilities.TryGetDecimal(50.5));
        }

        [Fact]
        public void TryGetDecimal_WithDefaultValue_ReturnsValueOrDefault()
        {
            Assert.Equal(123.45m, ParsingUtilities.TryGetDecimal("123.45", 0m));
            Assert.Equal(99.9m, ParsingUtilities.TryGetDecimal(null, 99.9m));
            Assert.Equal(99.9m, ParsingUtilities.TryGetDecimal("invalid", 99.9m));
        }

        [Fact]
        public void TryGetDateTime_WithValidOrInvalidValue_ReturnsParsedDateTimeOrFallback()
        {
            Assert.Null(ParsingUtilities.TryGetDateTime(null));
            Assert.Null(ParsingUtilities.TryGetDateTime(""));
            Assert.Null(ParsingUtilities.TryGetDateTime("invalid_date"));

            var expected = new System.DateTime(2026, 10, 6, 15, 30, 0, System.DateTimeKind.Utc);
            Assert.Equal(expected, ParsingUtilities.TryGetDateTime("2026-10-06T15:30:00Z"));

            var fallback = new System.DateTime(2026, 1, 1);
            Assert.Equal(fallback, ParsingUtilities.TryGetDateTime(null, fallback));
            Assert.Equal(fallback, ParsingUtilities.TryGetDateTime("invalid", fallback));
        }

        [Fact]
        public void TryGetDateOnly_WithValidOrInvalidValue_ReturnsParsedDateOnlyOrFallback()
        {
            Assert.Null(ParsingUtilities.TryGetDateOnly(null));
            Assert.Null(ParsingUtilities.TryGetDateOnly(""));
            Assert.Null(ParsingUtilities.TryGetDateOnly("not_a_date"));

            var expected = new System.DateOnly(2026, 10, 6);
            Assert.Equal(expected, ParsingUtilities.TryGetDateOnly("2026-10-06"));

            var fallback = new System.DateOnly(2026, 1, 1);
            Assert.Equal(fallback, ParsingUtilities.TryGetDateOnly(null, fallback));
            Assert.Equal(fallback, ParsingUtilities.TryGetDateOnly("invalid", fallback));
        }

        [Fact]
        public void TryGetString_WithObject_ReturnsStringOrFallback()
        {
            Assert.Null(ParsingUtilities.TryGetString(null));
            Assert.Equal("test", ParsingUtilities.TryGetString("test"));
            Assert.Equal("123", ParsingUtilities.TryGetString(123));

            Assert.Equal("fallback", ParsingUtilities.TryGetString(null, "fallback"));
            Assert.Equal("hello", ParsingUtilities.TryGetString("hello", "fallback"));
        }

        [Fact]
        public void TryGetInt32_WithValidOrInvalidValue_ReturnsParsedIntOrFallback()
        {
            Assert.Null(ParsingUtilities.TryGetInt32(null));
            Assert.Null(ParsingUtilities.TryGetInt32(""));
            Assert.Null(ParsingUtilities.TryGetInt32("invalid"));

            Assert.Equal(42, ParsingUtilities.TryGetInt32(42));
            Assert.Equal(100, ParsingUtilities.TryGetInt32("100"));
            Assert.Equal(15, ParsingUtilities.TryGetInt32((long)15));
            Assert.Equal(7, ParsingUtilities.TryGetInt32((short)7));
            Assert.Equal(3, ParsingUtilities.TryGetInt32((byte)3));

            Assert.Equal(99, ParsingUtilities.TryGetInt32(null, 99));
            Assert.Equal(99, ParsingUtilities.TryGetInt32("invalid", 99));
            Assert.Equal(50, ParsingUtilities.TryGetInt32(50, 99));
        }
    }
}
