using System;
using Audex.Application.Services.Common;
using Xunit;

namespace Audex.Application.Tests.Services.Common
{
    public class TimeZoneServiceTests
    {
        [Fact]
        public void GetTimeZones_Should_Return_Non_Empty_Sorted_List()
        {
            var service = new TimeZoneService();

            var result = service.GetTimeZones();

            Assert.NotNull(result);
            Assert.NotEmpty(result);
        }

        [Theory]
        [InlineData("Europe/Moscow")]
        [InlineData("UTC")]
        public void ResolveTimeZone_With_Valid_Iana_Should_Return_TimeZoneInfo(string timeZoneId)
        {
            var service = new TimeZoneService();

            var resolvedTimeZone = service.ResolveTimeZone(timeZoneId);

            Assert.NotNull(resolvedTimeZone);
        }

        [Fact]
        public void ResolveTimeZone_With_Invalid_Id_Should_Throw_TimeZoneNotFoundException()
        {
            var service = new TimeZoneService();

            Assert.Throws<TimeZoneNotFoundException>(() => service.ResolveTimeZone("NonExistent/TimeZone_12345"));
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void ResolveTimeZone_With_Empty_Or_Whitespace_Should_Throw_ArgumentException(string? timeZoneId)
        {
            var service = new TimeZoneService();

            Assert.Throws<ArgumentException>(() => service.ResolveTimeZone(timeZoneId!));
        }

        [Fact]
        public void ConvertToUtc_Should_Correctly_Calculate_Utc_DateTime()
        {
            var service = new TimeZoneService();
            var moscowTimeZone = service.ResolveTimeZone("Europe/Moscow");
            var localDateTime = new DateTime(2026, 6, 15, 14, 30, 0);

            var utcDateTime = service.ConvertToUtc(localDateTime, moscowTimeZone);

            var expectedUtc = localDateTime.AddHours(-3);
            Assert.Equal(expectedUtc, utcDateTime);
            Assert.Equal(DateTimeKind.Utc, utcDateTime.Kind);
        }
    }
}
