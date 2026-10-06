#nullable enable
using System;
using Audex.Application.Utilities;
using Xunit;

namespace Audex.Application.Tests.Utilities
{
    public class TabularDataExtensionsTests
    {
        [Fact]
        public void RowAccessors_WithValidRow_ReturnsExtractedValuesCorrectly()
        {
            var sampleRow = new object?[]
            {
                "MOEX_TEST",
                123.45m,
                "2026-10-06T12:00:00Z",
                "2026-10-06",
                1
            };

            Assert.Equal("MOEX_TEST", sampleRow.GetString(0));
            Assert.Equal("MOEX_TEST", sampleRow.TryGetString(0));

            Assert.Equal(123.45m, sampleRow.GetDecimal(1));
            Assert.Equal(123.45m, sampleRow.TryGetDecimal(1));

            var expectedDateTime = new DateTime(2026, 10, 6, 12, 0, 0, DateTimeKind.Utc);
            Assert.Equal(expectedDateTime, sampleRow.GetDateTime(2));
            Assert.Equal(expectedDateTime, sampleRow.TryGetDateTime(2));

            var expectedDateOnly = new DateOnly(2026, 10, 6);
            Assert.Equal(expectedDateOnly, sampleRow.GetDateOnly(3));
            Assert.Equal(expectedDateOnly, sampleRow.TryGetDateOnly(3));

            Assert.Equal(1, sampleRow.GetInt32(4));
            Assert.Equal(1, sampleRow.TryGetInt32(4));
        }

        [Fact]
        public void RowAccessors_WithNullRowOrOutOfBoundsIndex_ReturnsFallbackSafely()
        {
            var sampleRow = new object?[] { "TEST" };
            object?[]? nullRow = null;

            Assert.Equal(string.Empty, sampleRow.GetString(-1));
            Assert.Equal(string.Empty, sampleRow.GetString(5));
            Assert.Equal("default", nullRow.GetString(0, "default"));
            Assert.Null(sampleRow.TryGetString(-1));

            Assert.Equal(0m, sampleRow.GetDecimal(-1));
            Assert.Equal(10m, sampleRow.GetDecimal(5, 10m));
            Assert.Null(nullRow.TryGetDecimal(0));

            Assert.Equal(default(DateTime), sampleRow.GetDateTime(-1));
            Assert.Null(sampleRow.TryGetDateTime(5));

            Assert.Equal(default(DateOnly), sampleRow.GetDateOnly(-1));
            Assert.Null(sampleRow.TryGetDateOnly(5));

            Assert.Equal(0, sampleRow.GetInt32(-1));
            Assert.Equal(77, sampleRow.GetInt32(5, 77));
            Assert.Null(nullRow.TryGetInt32(0));
        }
    }
}
