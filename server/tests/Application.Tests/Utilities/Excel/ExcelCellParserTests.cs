using System;
using ClosedXML.Excel;
using Audex.Application.Services.Common;
using Audex.Application.Utilities.Excel;
using Xunit;

namespace Audex.Application.Tests.Utilities.Excel
{
    public class ExcelCellParserTests
    {
        [Fact]
        public void ParseInt_WithNumberCell_ShouldReturnRoundedInteger()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue(42.0);

            var result = ExcelCellParser.ParseInt(cell);

            Assert.Equal(42, result);
        }

        [Fact]
        public void ParseInt_WithStringWithSpacesAndComma_ShouldReturnParsedInteger()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue(" 1 500,00 ");

            var result = ExcelCellParser.ParseInt(cell);

            Assert.Equal(1500, result);
        }

        [Fact]
        public void ParseInt_WithNonBreakingSpace_ShouldReturnParsedInteger()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue("2\u00A0000");

            var result = ExcelCellParser.ParseInt(cell);

            Assert.Equal(2000, result);
        }

        [Fact]
        public void ParseInt_WithNullOrEmptyCell_ShouldReturnDefaultValue()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var emptyCell = worksheet.Cell(1, 1);

            var resultFromEmpty = ExcelCellParser.ParseInt(emptyCell, defaultValue: 10);
            var resultFromNull = ExcelCellParser.ParseInt(null, defaultValue: 20);

            Assert.Equal(10, resultFromEmpty);
            Assert.Equal(20, resultFromNull);
        }

        [Fact]
        public void ParseDecimal_WithNumberCell_ShouldReturnDecimalValue()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue(1234.56);

            var result = ExcelCellParser.ParseDecimal(cell);

            Assert.Equal(1234.56m, result);
        }

        [Fact]
        public void ParseDecimal_WithStringWithSpacesAndComma_ShouldReturnDecimalValue()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue(" 2 500,75 ");

            var result = ExcelCellParser.ParseDecimal(cell);

            Assert.Equal(2500.75m, result);
        }

        [Fact]
        public void ParseDecimal_WithInvalidText_ShouldReturnDefaultValue()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue("not_a_number");

            var result = ExcelCellParser.ParseDecimal(cell, defaultValue: 99.9m);

            Assert.Equal(99.9m, result);
        }

        [Fact]
        public void ParseDateTime_WithDateTimeCell_ShouldReturnUtcDateTime()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            var localDateTime = new DateTime(2026, 7, 20, 15, 45, 0);
            cell.SetValue(localDateTime);

            var timeZoneService = new TimeZoneService();
            var moscowTimeZone = timeZoneService.ResolveTimeZone("Europe/Moscow");

            var (extractedDateTime, rawString) = ExcelCellParser.ParseDateTime(cell, moscowTimeZone, timeZoneService);

            Assert.Equal(localDateTime.AddHours(-3), extractedDateTime);
            Assert.Equal("20.07.2026 15:45:00", rawString);
        }

        [Fact]
        public void ParseDateTime_WithStringRussianFormat_ShouldReturnUtcDateTime()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var cell = worksheet.Cell(1, 1);
            cell.SetValue("15.03.2026 10:00:00");

            var timeZoneService = new TimeZoneService();
            var moscowTimeZone = timeZoneService.ResolveTimeZone("Europe/Moscow");

            var (extractedDateTime, rawString) = ExcelCellParser.ParseDateTime(cell, moscowTimeZone, timeZoneService);

            var expectedUtc = new DateTime(2026, 3, 15, 7, 0, 0, DateTimeKind.Utc);
            Assert.Equal(expectedUtc, extractedDateTime);
            Assert.Equal("15.03.2026 10:00:00", rawString);
        }

        [Fact]
        public void ParseDateTime_WithEmptyOrNullCell_ShouldReturnMinValue()
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.AddWorksheet("Sheet1");
            var emptyCell = worksheet.Cell(1, 1);

            var timeZoneService = new TimeZoneService();
            var utcTimeZone = TimeZoneInfo.Utc;

            var (emptyDateTime, emptyRaw) = ExcelCellParser.ParseDateTime(emptyCell, utcTimeZone, timeZoneService);
            var (nullDateTime, nullRaw) = ExcelCellParser.ParseDateTime(null, utcTimeZone, timeZoneService);

            Assert.Equal(DateTime.MinValue, emptyDateTime);
            Assert.Empty(emptyRaw);
            Assert.Equal(DateTime.MinValue, nullDateTime);
            Assert.Empty(nullRaw);
        }
    }
}
