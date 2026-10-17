#nullable enable
using System;
using Audex.Application.Utilities;
using Xunit;

namespace Audex.Application.Tests.Utilities
{
    public class DateUtilitiesTests
    {
        [Fact]
        public void Min_WithNonNullableDates_ReturnsEarlierDate()
        {
            var earlierDate = new DateOnly(2026, 1, 15);
            var laterDate = new DateOnly(2026, 6, 20);

            Assert.Equal(earlierDate, DateUtilities.Min(earlierDate, laterDate));
            Assert.Equal(earlierDate, DateUtilities.Min(laterDate, earlierDate));
        }

        [Fact]
        public void Max_WithNonNullableDates_ReturnsLaterDate()
        {
            var earlierDate = new DateOnly(2026, 1, 15);
            var laterDate = new DateOnly(2026, 6, 20);

            Assert.Equal(laterDate, DateUtilities.Max(earlierDate, laterDate));
            Assert.Equal(laterDate, DateUtilities.Max(laterDate, earlierDate));
        }

        [Fact]
        public void Min_WithNullableDates_HandlesNullValuesCorrectly()
        {
            var earlierDate = new DateOnly(2026, 1, 15);
            var laterDate = new DateOnly(2026, 6, 20);

            // Both present
            Assert.Equal(earlierDate, DateUtilities.Min((DateOnly?)earlierDate, (DateOnly?)laterDate));
            Assert.Equal(earlierDate, DateUtilities.Min((DateOnly?)laterDate, (DateOnly?)earlierDate));

            // One is null
            Assert.Equal(earlierDate, DateUtilities.Min(earlierDate, null));
            Assert.Equal(earlierDate, DateUtilities.Min(null, earlierDate));

            // Both null
            Assert.Null(DateUtilities.Min(null, null));
        }

        [Fact]
        public void Max_WithNullableDates_HandlesNullValuesCorrectly()
        {
            var earlierDate = new DateOnly(2026, 1, 15);
            var laterDate = new DateOnly(2026, 6, 20);

            // Both present
            Assert.Equal(laterDate, DateUtilities.Max((DateOnly?)earlierDate, (DateOnly?)laterDate));
            Assert.Equal(laterDate, DateUtilities.Max((DateOnly?)laterDate, (DateOnly?)earlierDate));

            // One is null
            Assert.Equal(laterDate, DateUtilities.Max(laterDate, null));
            Assert.Equal(laterDate, DateUtilities.Max(null, laterDate));

            // Both null
            Assert.Null(DateUtilities.Max(null, null));
        }

        [Fact]
        public void Min_WithMixedNullableAndNonNullableDates_ReturnsExpectedDate()
        {
            var earlierDate = new DateOnly(2026, 1, 15);
            var laterDate = new DateOnly(2026, 6, 20);

            Assert.Equal(earlierDate, DateUtilities.Min(earlierDate, (DateOnly?)laterDate));
            Assert.Equal(earlierDate, DateUtilities.Min(laterDate, (DateOnly?)earlierDate));
            Assert.Equal(earlierDate, DateUtilities.Min(earlierDate, (DateOnly?)null));

            Assert.Equal(earlierDate, DateUtilities.Min((DateOnly?)earlierDate, laterDate));
            Assert.Equal(earlierDate, DateUtilities.Min((DateOnly?)laterDate, earlierDate));
            Assert.Equal(laterDate, DateUtilities.Min((DateOnly?)null, laterDate));
        }

        [Fact]
        public void Max_WithMixedNullableAndNonNullableDates_ReturnsExpectedDate()
        {
            var earlierDate = new DateOnly(2026, 1, 15);
            var laterDate = new DateOnly(2026, 6, 20);

            Assert.Equal(laterDate, DateUtilities.Max(earlierDate, (DateOnly?)laterDate));
            Assert.Equal(laterDate, DateUtilities.Max(laterDate, (DateOnly?)earlierDate));
            Assert.Equal(earlierDate, DateUtilities.Max(earlierDate, (DateOnly?)null));

            Assert.Equal(laterDate, DateUtilities.Max((DateOnly?)earlierDate, laterDate));
            Assert.Equal(laterDate, DateUtilities.Max((DateOnly?)laterDate, earlierDate));
            Assert.Equal(laterDate, DateUtilities.Max((DateOnly?)null, laterDate));
        }
    }
}
