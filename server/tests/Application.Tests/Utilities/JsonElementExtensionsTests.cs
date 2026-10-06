#nullable enable
using System;
using System.Text.Json;
using Audex.Application.Utilities;
using Xunit;

namespace Audex.Application.Tests.Utilities
{
    public class JsonElementExtensionsTests
    {
        [Fact]
        public void TryGetDecimal_WithValidNumberAndString_ReturnsParsedDecimal()
        {
            using var document = JsonDocument.Parse("""
            {
                "numberValue": 123.45,
                "stringValue": "678.90",
                "invalidString": "not_a_number"
            }
            """);
            var rootElement = document.RootElement;

            Assert.Equal(123.45m, rootElement.TryGetDecimal("numberValue"));
            Assert.Equal(678.90m, rootElement.TryGetDecimal("stringValue"));
            Assert.Null(rootElement.TryGetDecimal("invalidString"));
            Assert.Null(rootElement.TryGetDecimal("missingProperty"));
        }

        [Fact]
        public void GetDecimal_WithFallback_ReturnsExpectedValue()
        {
            using var document = JsonDocument.Parse("""
            {
                "validValue": 42.5
            }
            """);
            var rootElement = document.RootElement;

            Assert.Equal(42.5m, rootElement.GetDecimal("validValue", 10m));
            Assert.Equal(10m, rootElement.GetDecimal("missingProperty", 10m));
            Assert.Equal(0m, rootElement.GetDecimal("missingProperty"));
        }

        [Fact]
        public void TryGetDateTime_WithUnixTimestampsAndIsoStrings_ReturnsUtcDateTime()
        {
            using var document = JsonDocument.Parse("""
            {
                "unixSeconds": 1704067200,
                "unixMilliseconds": 1704067200000,
                "isoString": "2024-01-01T00:00:00Z",
                "invalidString": "invalid_date"
            }
            """);
            var rootElement = document.RootElement;

            var expectedDateTime = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            Assert.Equal(expectedDateTime, rootElement.TryGetDateTime("unixSeconds"));
            Assert.Equal(expectedDateTime, rootElement.TryGetDateTime("unixMilliseconds"));
            Assert.Equal(expectedDateTime, rootElement.TryGetDateTime("isoString"));
            Assert.Null(rootElement.TryGetDateTime("invalidString"));
            Assert.Null(rootElement.TryGetDateTime("missingProperty"));
        }

        [Fact]
        public void GetDateTime_WithFallback_ReturnsExpectedValue()
        {
            using var document = JsonDocument.Parse("""
            {
                "unixSeconds": 1704067200
            }
            """);
            var rootElement = document.RootElement;

            var expectedDateTime = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var fallbackDateTime = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            Assert.Equal(expectedDateTime, rootElement.GetDateTime("unixSeconds", fallbackDateTime));
            Assert.Equal(fallbackDateTime, rootElement.GetDateTime("missingProperty", fallbackDateTime));
            Assert.Equal(default, rootElement.GetDateTime("missingProperty"));
        }

        [Fact]
        public void TryGetString_AndGetString_ReturnsStringOrFallback()
        {
            using var document = JsonDocument.Parse("""
            {
                "normalString": "Audex",
                "emptyString": "",
                "nullValue": null,
                "numberToString": 777
            }
            """);
            var rootElement = document.RootElement;

            Assert.Equal("Audex", rootElement.TryGetString("normalString"));
            Assert.Equal("", rootElement.TryGetString("emptyString"));
            Assert.Null(rootElement.TryGetString("nullValue"));
            Assert.Equal("777", rootElement.TryGetString("numberToString"));
            Assert.Null(rootElement.TryGetString("missingProperty"));

            Assert.Equal("Audex", rootElement.GetString("normalString", "default"));
            Assert.Equal("default", rootElement.GetString("emptyString", "default"));
            Assert.Equal("default", rootElement.GetString("missingProperty", "default"));
            Assert.Equal("", rootElement.GetString("missingProperty"));
        }

        [Fact]
        public void TryGetInt32_AndGetInt32_ReturnsExpectedValue()
        {
            using var document = JsonDocument.Parse("""
            {
                "validNumber": 42,
                "validString": "123",
                "invalidString": "not_an_int"
            }
            """);
            var rootElement = document.RootElement;

            Assert.Equal(42, rootElement.TryGetInt32("validNumber"));
            Assert.Equal(123, rootElement.TryGetInt32("validString"));
            Assert.Null(rootElement.TryGetInt32("invalidString"));
            Assert.Null(rootElement.TryGetInt32("missingProperty"));

            Assert.Equal(42, rootElement.GetInt32("validNumber", 99));
            Assert.Equal(99, rootElement.GetInt32("missingProperty", 99));
            Assert.Equal(0, rootElement.GetInt32("missingProperty"));
        }

        [Fact]
        public void TryGetInt64_AndGetInt64_ReturnsExpectedValue()
        {
            using var document = JsonDocument.Parse("""
            {
                "validNumber": 9876543210123,
                "validString": "9876543210123",
                "invalidString": "not_a_long"
            }
            """);
            var rootElement = document.RootElement;

            Assert.Equal(9876543210123L, rootElement.TryGetInt64("validNumber"));
            Assert.Equal(9876543210123L, rootElement.TryGetInt64("validString"));
            Assert.Null(rootElement.TryGetInt64("invalidString"));
            Assert.Null(rootElement.TryGetInt64("missingProperty"));

            Assert.Equal(9876543210123L, rootElement.GetInt64("validNumber", 55L));
            Assert.Equal(55L, rootElement.GetInt64("missingProperty", 55L));
            Assert.Equal(0L, rootElement.GetInt64("missingProperty"));
        }
    }
}
