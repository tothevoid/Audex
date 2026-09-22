using System;
using ClosedXML.Excel;
using Audex.Application.Services.Brokers.Statements.Vtb;
using Audex.Application.Services.Brokers.Statements.Vtb.Models;
using Audex.Application.Services.Common;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements.Vtb
{
    public class VtbStatementRowParserTests
    {
        [Fact]
        public void TryBuildTableSchema_Should_Return_Valid_Schema_When_Headers_Present()
        {
            // Arrange
            var parser = new VtbStatementRowParser();
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("TestSheet");

            worksheet.Cell(1, 1).Value = "Наименование ценной бумаги, ISIN";
            worksheet.Cell(1, 2).Value = "Дата и время заключения сделки";
            worksheet.Cell(1, 3).Value = "Вид сделки";
            worksheet.Cell(1, 4).Value = "Количество (шт.)";
            worksheet.Cell(1, 5).Value = "Цена";
            worksheet.Cell(1, 6).Value = "Валюта расчетов";

            // Act
            var schema = parser.TryBuildTableSchema(worksheet, 1);

            // Assert
            Assert.NotNull(schema);
            Assert.True(schema.IsValid);
            Assert.Equal(6, schema.BoundColumns.Count);
        }

        [Fact]
        public void TryBuildTableSchema_Should_Return_Null_When_Required_Columns_Missing()
        {
            // Arrange
            var parser = new VtbStatementRowParser();
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("TestSheet");

            worksheet.Cell(1, 1).Value = "Количество (шт.)";
            worksheet.Cell(1, 2).Value = "Цена";

            // Act
            var schema = parser.TryBuildTableSchema(worksheet, 1);

            // Assert
            Assert.Null(schema);
        }

        [Fact]
        public void ParseRow_Should_Correctly_Extract_Transaction_Values()
        {
            // Arrange
            var parser = new VtbStatementRowParser();
            var timeZoneService = new TimeZoneService();
            var timeZone = timeZoneService.ResolveTimeZone("Europe/Moscow");

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("TestSheet");

            worksheet.Cell(1, 1).Value = "Наименование ценной бумаги, ISIN";
            worksheet.Cell(1, 2).Value = "Дата и время заключения сделки";
            worksheet.Cell(1, 3).Value = "Вид сделки";
            worksheet.Cell(1, 4).Value = "Количество (шт.)";
            worksheet.Cell(1, 5).Value = "Цена";
            worksheet.Cell(1, 6).Value = "Валюта расчетов";
            worksheet.Cell(1, 7).Value = "Комиссия Банка за заключение сделки";
            worksheet.Cell(1, 8).Value = "№ сделки";

            worksheet.Cell(2, 1).Value = "Сбербанк, RU0009029540";
            worksheet.Cell(2, 2).Value = "15.01.2026 12:00:00";
            worksheet.Cell(2, 3).Value = "Покупка";
            worksheet.Cell(2, 4).Value = 20;
            worksheet.Cell(2, 5).Value = 295.5;
            worksheet.Cell(2, 6).Value = "RUR";
            worksheet.Cell(2, 7).Value = 2.50;
            worksheet.Cell(2, 8).Value = "TRADE_12345";

            var schema = parser.TryBuildTableSchema(worksheet, 1);
            Assert.NotNull(schema);

            var context = new VtbParsingContext
            {
                TimeZone = timeZone,
                TimeZoneService = timeZoneService,
                IsCurrencyTable = false
            };

            // Act
            var transaction = parser.ParseRow(worksheet.Row(2), schema, context);

            // Assert
            Assert.NotNull(transaction);
            Assert.Equal("RU0009029540", transaction.Isin);
            Assert.Equal("Сбербанк", transaction.SecurityName);
            Assert.False(transaction.IsSell);
            Assert.Equal(20, transaction.Quantity);
            Assert.Equal(295.5m, transaction.Price);
            Assert.Equal("RUB", transaction.Currency);
            Assert.Equal(2.50m, transaction.BrokerCommission);
            Assert.Equal("TRADE_12345", transaction.TradeNumber);
        }

        [Fact]
        public void ParseRow_Should_Return_Null_For_Summary_Row()
        {
            // Arrange
            var parser = new VtbStatementRowParser();
            var timeZoneService = new TimeZoneService();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("TestSheet");

            worksheet.Cell(1, 1).Value = "Наименование ценной бумаги, ISIN";
            worksheet.Cell(1, 2).Value = "Дата и время заключения сделки";

            worksheet.Cell(2, 1).Value = "Итого по сделкам:";

            var schema = parser.TryBuildTableSchema(worksheet, 1);
            Assert.NotNull(schema);

            var context = new VtbParsingContext
            {
                TimeZone = TimeZoneInfo.Utc,
                TimeZoneService = timeZoneService,
                IsCurrencyTable = false
            };

            // Act
            var transaction = parser.ParseRow(worksheet.Row(2), schema, context);

            // Assert
            Assert.Null(transaction);
        }

        [Fact]
        public void ParseRow_Should_Correctly_Extract_Currency_Transaction_Values()
        {
            // Arrange
            var parser = new VtbStatementRowParser();
            var timeZoneService = new TimeZoneService();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("CurrencyTestSheet");

            worksheet.Cell(1, 1).Value = "Наименование ценной бумаги";
            worksheet.Cell(1, 2).Value = "Дата и время заключения";
            worksheet.Cell(1, 3).Value = "Вид сделки";
            worksheet.Cell(1, 4).Value = "Количество (шт.)";
            worksheet.Cell(1, 5).Value = "Цена";
            worksheet.Cell(1, 6).Value = "Валюта расчетов";

            worksheet.Cell(2, 1).Value = "USD000UTSTOM, Доллар США";
            worksheet.Cell(2, 2).Value = "15.01.2026 14:30:00";
            worksheet.Cell(2, 3).Value = "Покупка";
            worksheet.Cell(2, 4).Value = 1000;
            worksheet.Cell(2, 5).Value = 92.50;
            worksheet.Cell(2, 6).Value = "RUB";

            var schema = parser.TryBuildTableSchema(worksheet, 1);
            Assert.NotNull(schema);

            var context = new VtbParsingContext
            {
                TimeZone = TimeZoneInfo.Utc,
                TimeZoneService = timeZoneService,
                IsCurrencyTable = true
            };

            // Act
            var transaction = parser.ParseRow(worksheet.Row(2), schema, context);

            // Assert
            Assert.NotNull(transaction);
            Assert.Null(transaction.Isin);
            Assert.Equal("USD000UTSTOM", transaction.Ticker);
            Assert.Equal("Доллар США", transaction.SecurityName);
            Assert.Equal(1000, transaction.Quantity);
            Assert.Equal(92.50m, transaction.Price);
            Assert.Equal("RUB", transaction.Currency);
        }
    }
}
