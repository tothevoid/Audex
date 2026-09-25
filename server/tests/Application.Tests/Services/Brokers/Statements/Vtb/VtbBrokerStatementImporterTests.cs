using System.IO;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Audex.Application.Services.Brokers.Statements.Vtb;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements.Vtb
{
    public class VtbBrokerStatementImporterTests
    {
        [Fact]
        public async Task ParseAsync_Should_Correctly_Extract_Transactions_And_Commissions()
        {
            // Arrange
            var importer = new VtbBrokerStatementImporter();
            using var stream = CreateSampleVtbWorkbookStream();

            // Act
            var transactions = await importer.ParseAsync(stream, "Europe/Moscow");

            // Assert
            Assert.NotNull(transactions);
            Assert.Equal(2, transactions.Count);

            // Deal 1: Buy
            var deal1 = transactions[0];
            Assert.Equal("RU000A0JRKT8", deal1.Isin);
            Assert.Equal("ФосАгро ао", deal1.SecurityName);
            Assert.False(deal1.IsSell);
            Assert.Equal(1, deal1.Quantity);
            Assert.Equal(6402.0m, deal1.Price);
            Assert.Equal(2.56m, deal1.BrokerCommission);
            Assert.Equal(0.00m, deal1.StockExchangeCommission);
            Assert.Equal("RUB", deal1.Currency);

            // Deal 2: Sell
            var deal2 = transactions[1];
            Assert.Equal("RU0009029540", deal2.Isin);
            Assert.Equal("Сбербанк", deal2.SecurityName);
            Assert.True(deal2.IsSell);
            Assert.Equal(10, deal2.Quantity);
            Assert.Equal(280.50m, deal2.Price);
            Assert.Equal(1.12m, deal2.BrokerCommission);
            Assert.Equal(0.42m, deal2.StockExchangeCommission);
        }

        private static MemoryStream CreateSampleVtbWorkbookStream()
        {
            var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Отчет");

            // Header section
            ws.Cell(1, 1).Value = "Заключенные в отчетном периоде сделки с ценными бумагами";

            // Columns row
            ws.Cell(2, 1).Value = "Наименование ценной бумаги, № гос. регистрации, ISIN";
            ws.Cell(2, 2).Value = "Дата и время заключения сделки";
            ws.Cell(2, 3).Value = "Вид сделки";
            ws.Cell(2, 4).Value = "Количество (шт.)";
            ws.Cell(2, 5).Value = "Валюта цены (номинала для облигаций)";
            ws.Cell(2, 6).Value = "Цена (% для облигаций)";
            ws.Cell(2, 7).Value = "Валюта расчетов";
            ws.Cell(2, 8).Value = "Сумма сделки в валюте расчетов";
            ws.Cell(2, 9).Value = "НКД по сделке в валюте расчетов";
            ws.Cell(2, 10).Value = "Комиссия Банка за расчет по сделке";
            ws.Cell(2, 11).Value = "Комиссия Банка за заключение сделки";

            // Row 1: Buy PhosAgro
            ws.Cell(3, 1).Value = "ФосАгро ао, 1-02-06556-A, RU000A0JRKT8";
            ws.Cell(3, 2).Value = "08.12.2025 16:46:27";
            ws.Cell(3, 3).Value = "Покупка";
            ws.Cell(3, 4).Value = 1.0;
            ws.Cell(3, 5).Value = "RUR";
            ws.Cell(3, 6).Value = 6402.0;
            ws.Cell(3, 7).Value = "RUR";
            ws.Cell(3, 8).Value = 6402.00;
            ws.Cell(3, 9).Value = 0.00;
            ws.Cell(3, 10).Value = 0.00;
            ws.Cell(3, 11).Value = 2.56;

            // Row 2: Sell Sberbank
            ws.Cell(4, 1).Value = "Сбербанк, 1-03-00014-A, RU0009029540";
            ws.Cell(4, 2).Value = "09.12.2025 10:15:30";
            ws.Cell(4, 3).Value = "Продажа";
            ws.Cell(4, 4).Value = 10.0;
            ws.Cell(4, 5).Value = "RUR";
            ws.Cell(4, 6).Value = 280.50;
            ws.Cell(4, 7).Value = "RUR";
            ws.Cell(4, 8).Value = 2805.00;
            ws.Cell(4, 9).Value = 0.00;
            ws.Cell(4, 10).Value = 0.42;
            ws.Cell(4, 11).Value = 1.12;

            // Summary / end of table
            ws.Cell(5, 1).Value = "Итого:";

            var ms = new MemoryStream();
            workbook.SaveAs(ms);
            ms.Position = 0;
            return ms;
        }

        [Fact]
        public async Task ParseAsync_Should_Find_Table_When_Located_Past_Row_100()
        {
            // Arrange
            var importer = new VtbBrokerStatementImporter();
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("brokerage_report");

            // Fill rows 1..149 with metadata and other summary tables
            ws.Cell(1, 1).Value = "Отчет Банка ВТБ (ПАО)";
            ws.Cell(15, 1).Value = "ВХОДЯЩИЙ остаток денежных средств";

            // Deals table starts at row 150
            ws.Cell(150, 1).Value = "Заключенные в отчетном периоде сделки с ценными бумагами";
            ws.Cell(151, 1).Value = "Наименование ценной бумаги, ISIN";
            ws.Cell(151, 2).Value = "Дата и время заключения сделки";
            ws.Cell(151, 3).Value = "Вид сделки";
            ws.Cell(151, 4).Value = "Количество (шт.)";
            ws.Cell(151, 5).Value = "Цена";
            ws.Cell(151, 6).Value = "Валюта расчетов";
            ws.Cell(151, 7).Value = "Комиссия Банка за заключение сделки";
            ws.Cell(151, 8).Value = "Комиссия Банка за расчет по сделке";

            ws.Cell(152, 1).Value = "Лукойл, RU0009024277";
            ws.Cell(152, 2).Value = "10.12.2025 14:20:00";
            ws.Cell(152, 3).Value = "Покупка";
            ws.Cell(152, 4).Value = 5;
            ws.Cell(152, 5).Value = 6800.0;
            ws.Cell(152, 6).Value = "RUR";
            ws.Cell(152, 7).Value = 3.50;
            ws.Cell(152, 8).Value = 1.20;

            ws.Cell(153, 1).Value = "Итого по сделкам:";

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            ms.Position = 0;

            // Act
            var transactions = await importer.ParseAsync(ms, "Europe/Moscow");

            // Assert
            Assert.NotNull(transactions);
            Assert.Single(transactions);
            Assert.Equal("RU0009024277", transactions[0].Isin);
            Assert.Equal("Лукойл", transactions[0].SecurityName);
            Assert.Equal(5, transactions[0].Quantity);
            Assert.Equal(6800.0m, transactions[0].Price);
            Assert.Equal(3.50m, transactions[0].BrokerCommission);
            Assert.Equal(1.20m, transactions[0].StockExchangeCommission);
        }

        [Fact]
        public async Task ParseAsync_Should_Stop_Before_Settled_Deals_Table()
        {
            // Arrange
            var importer = new VtbBrokerStatementImporter();
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("brokerage_report");

            ws.Cell(1, 1).Value = "Заключенные в отчетном периоде сделки с ценными бумагами";
            ws.Cell(2, 1).Value = "Наименование ценной бумаги, № гос. регистрации, ISIN";
            ws.Cell(2, 2).Value = "Дата и время заключения сделки";
            ws.Cell(2, 3).Value = "Вид сделки";
            ws.Cell(2, 4).Value = "Количество (шт.)";
            ws.Cell(2, 5).Value = "Цена";
            ws.Cell(2, 6).Value = "Комиссия Банка за заключение сделки";
            ws.Cell(2, 7).Value = "Комиссия Банка за расчет по сделке";

            // Deal 1 in Table 1
            ws.Cell(3, 1).Value = "Полюс, RU000A0JNAA8";
            ws.Cell(3, 2).Value = "08.07.2026 14:33:52";
            ws.Cell(3, 3).Value = "Продажа";
            ws.Cell(3, 4).Value = 10;
            ws.Cell(3, 5).Value = 1380.0;
            ws.Cell(3, 6).Value = 0.0;
            ws.Cell(3, 7).Value = 0.0;

            // Table 2 (Settled deals duplicates) follows
            ws.Cell(5, 1).Value = "Завершенные в отчетном периоде сделки с ценными бумагами (обязательства прекращены)";
            ws.Cell(6, 1).Value = "Наименование ценной бумаги, № гос. регистрации, ISIN";
            ws.Cell(6, 2).Value = "Дата и время заключения сделки";
            ws.Cell(6, 3).Value = "Вид сделки";
            ws.Cell(6, 4).Value = "Количество (шт.)";
            ws.Cell(6, 5).Value = "Цена";
            ws.Cell(6, 6).Value = "Комиссия Банка за заключение сделки";
            ws.Cell(6, 7).Value = "Комиссия Банка за расчет по сделке";

            // Duplicate deal in Table 2
            ws.Cell(7, 1).Value = "Полюс, RU000A0JNAA8";
            ws.Cell(7, 2).Value = "08.07.2026 14:33:00";
            ws.Cell(7, 3).Value = "Продажа";
            ws.Cell(7, 4).Value = 10;
            ws.Cell(7, 5).Value = 1380.0;
            ws.Cell(7, 6).Value = 0.0;
            ws.Cell(7, 7).Value = 0.0;

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            ms.Position = 0;

            // Act
            var transactions = await importer.ParseAsync(ms, "Europe/Moscow");

            // Assert: only 1 transaction from Table 1 must be parsed, Table 2 must be completely ignored
            Assert.NotNull(transactions);
            Assert.Single(transactions);
            Assert.Equal("RU000A0JNAA8", transactions[0].Isin);
            Assert.Equal(10, transactions[0].Quantity);
            Assert.Equal(1380.0m, transactions[0].Price);
        }

        [Fact]
        public async Task ParseAsync_Should_Correctly_Extract_Currency_Deals_Table()
        {
            // Arrange
            var importer = new VtbBrokerStatementImporter();
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Отчет");

            // Header matching concluded currency deals table
            ws.Cell(1, 1).Value = "Сделки с иностранной валютой";

            ws.Cell(2, 1).Value = "Финансовый инструмент";
            ws.Cell(2, 2).Value = "Дата и время заключения сделки";
            ws.Cell(2, 3).Value = "Вид сделки";
            ws.Cell(2, 4).Value = "Количество (шт.)";
            ws.Cell(2, 5).Value = "Цена";
            ws.Cell(2, 6).Value = "Валюта расчетов";
            ws.Cell(2, 7).Value = "Сумма сделки в валюте расчетов";
            ws.Cell(2, 8).Value = "Комиссия Банка за расчет по сделке";
            ws.Cell(2, 9).Value = "Комиссия Банка за заключение сделки";
            ws.Cell(2, 10).Value = "Дата исполнения";
            ws.Cell(2, 11).Value = "№ заявки";
            ws.Cell(2, 12).Value = "№ сделки";
            ws.Cell(2, 13).Value = "НПР2 до сделки";
            ws.Cell(2, 14).Value = "Контрагент";
            ws.Cell(2, 15).Value = "Место заключения сделки";
            ws.Cell(2, 16).Value = "Комментарий";

            // Row 1: GLDRUB_TOM Buy from user's screenshot
            ws.Cell(3, 1).Value = "GLDRUB_TOM";
            ws.Cell(3, 2).Value = "15.05.2025 10:15:38";
            ws.Cell(3, 3).Value = "Покупка";
            ws.Cell(3, 4).Value = "1,0";
            ws.Cell(3, 5).Value = "10 787,7";
            ws.Cell(3, 6).Value = "RUR";
            ws.Cell(3, 7).Value = "10 787,70";
            ws.Cell(3, 8).Value = "1,00";
            ws.Cell(3, 9).Value = "26,97";
            ws.Cell(3, 10).Value = "18.05.2025";
            ws.Cell(3, 11).Value = "39951752484";
            ws.Cell(3, 12).Value = "CB742554787";

            // End of table
            ws.Cell(4, 1).Value = "Итого:";

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            ms.Position = 0;

            // Act
            var transactions = await importer.ParseAsync(ms, "Europe/Moscow");

            // Assert
            Assert.NotNull(transactions);
            Assert.Single(transactions);

            var deal = transactions[0];
            Assert.Null(deal.Isin);
            Assert.Equal("GLDRUB_TOM", deal.Ticker);
            Assert.Equal("GLDRUB_TOM", deal.SecurityName);
            Assert.False(deal.IsSell);
            Assert.Equal(1, deal.Quantity);
            Assert.Equal(10787.7m, deal.Price);
            Assert.Equal("RUB", deal.Currency);
            Assert.Equal(26.97m, deal.BrokerCommission);
            Assert.Equal(1.00m, deal.StockExchangeCommission);
            Assert.Equal("39951752484", deal.OrderNumber);
            Assert.Equal("CB742554787", deal.TradeNumber);
        }

        [Fact]
        public async Task ParseAsync_Should_Parse_Both_Securities_And_Currency_Deals_In_Same_Statement()
        {
            // Arrange
            var importer = new VtbBrokerStatementImporter();
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Отчет");

            // Section 1: Concluded securities deals
            ws.Cell(1, 1).Value = "Заключенные в отчетном периоде сделки с ценными бумагами";
            ws.Cell(2, 1).Value = "Наименование ценной бумаги, № гос. регистрации, ISIN";
            ws.Cell(2, 2).Value = "Дата и время заключения сделки";
            ws.Cell(2, 3).Value = "Вид сделки";
            ws.Cell(2, 4).Value = "Количество (шт.)";
            ws.Cell(2, 5).Value = "Цена";
            ws.Cell(2, 6).Value = "Валюта расчетов";
            ws.Cell(2, 7).Value = "Комиссия Банка за заключение сделки";
            ws.Cell(2, 8).Value = "Комиссия Банка за расчет по сделке";
            ws.Cell(2, 9).Value = "№ сделки";

            ws.Cell(3, 1).Value = "Сбербанк, RU0009029540";
            ws.Cell(3, 2).Value = "10.05.2025 11:00:00";
            ws.Cell(3, 3).Value = "Покупка";
            ws.Cell(3, 4).Value = 10;
            ws.Cell(3, 5).Value = 280.0;
            ws.Cell(3, 6).Value = "RUR";
            ws.Cell(3, 7).Value = 1.12;
            ws.Cell(3, 8).Value = 0.42;
            ws.Cell(3, 9).Value = "TX_SBER_01";

            ws.Cell(4, 1).Value = "Итого:";

            // Section 2: Settled securities deals (MUST be ignored to avoid duplicates)
            ws.Cell(6, 1).Value = "Завершенные в отчетном периоде сделки с ценными бумагами (обязательства прекращены)";
            ws.Cell(7, 1).Value = "Наименование ценной бумаги, № гос. регистрации, ISIN";
            ws.Cell(7, 2).Value = "Дата и время заключения сделки";
            ws.Cell(7, 3).Value = "Вид сделки";
            ws.Cell(7, 4).Value = "Количество (шт.)";
            ws.Cell(7, 5).Value = "Цена";
            ws.Cell(7, 6).Value = "№ сделки";

            ws.Cell(8, 1).Value = "Сбербанк, RU0009029540";
            ws.Cell(8, 2).Value = "10.05.2025 11:00:00";
            ws.Cell(8, 3).Value = "Покупка";
            ws.Cell(8, 4).Value = 10;
            ws.Cell(8, 5).Value = 280.0;
            ws.Cell(8, 6).Value = "TX_SBER_01";

            ws.Cell(9, 1).Value = "Итого:";

            // Section 3: Concluded currency deals
            ws.Cell(11, 1).Value = "Сделки с иностранной валютой";
            ws.Cell(12, 1).Value = "Финансовый инструмент";
            ws.Cell(12, 2).Value = "Дата и время заключения сделки";
            ws.Cell(12, 3).Value = "Вид сделки";
            ws.Cell(12, 4).Value = "Количество (шт.)";
            ws.Cell(12, 5).Value = "Цена";
            ws.Cell(12, 6).Value = "Валюта расчетов";
            ws.Cell(12, 7).Value = "Комиссия Банка за расчет по сделке";
            ws.Cell(12, 8).Value = "Комиссия Банка за заключение сделки";
            ws.Cell(12, 9).Value = "№ сделки";

            ws.Cell(13, 1).Value = "GLDRUB_TOM";
            ws.Cell(13, 2).Value = "15.05.2025 10:15:38";
            ws.Cell(13, 3).Value = "Покупка";
            ws.Cell(13, 4).Value = 1.0;
            ws.Cell(13, 5).Value = 10787.7;
            ws.Cell(13, 6).Value = "RUR";
            ws.Cell(13, 7).Value = 1.00;
            ws.Cell(13, 8).Value = 26.97;
            ws.Cell(13, 9).Value = "CB742554787";

            ws.Cell(14, 1).Value = "Итого:";

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            ms.Position = 0;

            // Act
            var transactions = await importer.ParseAsync(ms, "Europe/Moscow");

            // Assert
            Assert.NotNull(transactions);
            Assert.Equal(2, transactions.Count);

            var sber = transactions[0];
            Assert.Equal("RU0009029540", sber.Isin);
            Assert.Equal("TX_SBER_01", sber.TradeNumber);

            var gold = transactions[1];
            Assert.Null(gold.Isin);
            Assert.Equal("GLDRUB_TOM", gold.Ticker);
            Assert.Equal("CB742554787", gold.TradeNumber);
        }

        [Fact]
        public async Task ParseAsync_Should_Deduplicate_Currency_Deals_Present_In_Both_Concluded_And_Settled_Tables()
        {
            // Arrange
            var importer = new VtbBrokerStatementImporter();
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Отчет");

            // Section 1: Concluded currency deals
            worksheet.Cell(1, 1).Value = "Сделки с иностранной валютой";
            worksheet.Cell(2, 1).Value = "Финансовый инструмент";
            worksheet.Cell(2, 2).Value = "Дата и время заключения сделки";
            worksheet.Cell(2, 3).Value = "Вид сделки";
            worksheet.Cell(2, 4).Value = "Количество (шт.)";
            worksheet.Cell(2, 5).Value = "Цена";
            worksheet.Cell(2, 6).Value = "Валюта расчетов";
            worksheet.Cell(2, 7).Value = "Сумма сделки в валюте расчетов";
            worksheet.Cell(2, 8).Value = "Комиссия Банка за расчет по сделке";
            worksheet.Cell(2, 9).Value = "Комиссия Банка за заключение сделки";
            worksheet.Cell(2, 10).Value = "Дата исполнения";
            worksheet.Cell(2, 11).Value = "№ заявки";
            worksheet.Cell(2, 12).Value = "№ сделки";

            worksheet.Cell(3, 1).Value = "GLDRUB_TOM";
            worksheet.Cell(3, 2).Value = "10.06.2026 11:47:58";
            worksheet.Cell(3, 3).Value = "Покупка";
            worksheet.Cell(3, 4).Value = "1,0";
            worksheet.Cell(3, 5).Value = "9 596,0";
            worksheet.Cell(3, 6).Value = "RUR";
            worksheet.Cell(3, 7).Value = "9 596,00";
            worksheet.Cell(3, 8).Value = "1,00";
            worksheet.Cell(3, 9).Value = "23,99";
            worksheet.Cell(3, 10).Value = "11.06.2026";
            worksheet.Cell(3, 11).Value = "40039143864";
            worksheet.Cell(3, 12).Value = "CB745436299";

            worksheet.Cell(4, 1).Value = "Итого:";

            // Section 2: Settled currency deals with the EXACT same trade
            worksheet.Cell(6, 1).Value = "Завершенные в отчетном периоде сделки с иностранной валютой (обязательства прекращены)";
            worksheet.Cell(7, 1).Value = "Финансовый инструмент";
            worksheet.Cell(7, 2).Value = "Дата и время заключения сделки";
            worksheet.Cell(7, 3).Value = "Вид сделки";
            worksheet.Cell(7, 4).Value = "Количество (шт.)";
            worksheet.Cell(7, 5).Value = "Цена";
            worksheet.Cell(7, 6).Value = "Валюта расчетов";
            worksheet.Cell(7, 7).Value = "Сумма сделки в валюте расчетов";
            worksheet.Cell(7, 8).Value = "Комиссия Банка за расчет по сделке";
            worksheet.Cell(7, 9).Value = "Комиссия Банка за заключение сделки";
            worksheet.Cell(7, 10).Value = "Дата исполнения";
            worksheet.Cell(7, 11).Value = "№ заявки";
            worksheet.Cell(7, 12).Value = "№ сделки";

            worksheet.Cell(8, 1).Value = "GLDRUB_TOM";
            worksheet.Cell(8, 2).Value = "10.06.2026 11:47:58";
            worksheet.Cell(8, 3).Value = "Покупка";
            worksheet.Cell(8, 4).Value = "1,0";
            worksheet.Cell(8, 5).Value = "9 596,0";
            worksheet.Cell(8, 6).Value = "RUR";
            worksheet.Cell(8, 7).Value = "9 596,00";
            worksheet.Cell(8, 8).Value = "1,00";
            worksheet.Cell(8, 9).Value = "23,99";
            worksheet.Cell(8, 10).Value = "11.06.2026";
            worksheet.Cell(8, 11).Value = "40039143864";
            worksheet.Cell(8, 12).Value = "CB745436299";

            worksheet.Cell(9, 1).Value = "Итого:";

            using var memoryStream = new MemoryStream();
            workbook.SaveAs(memoryStream);
            memoryStream.Position = 0;

            // Act
            var transactions = await importer.ParseAsync(memoryStream, "Europe/Moscow");

            // Assert: Must deduplicate to exactly 1 transaction
            Assert.NotNull(transactions);
            Assert.Single(transactions);

            var deal = transactions[0];
            Assert.Equal("GLDRUB_TOM", deal.Ticker);
            Assert.Equal(1, deal.Quantity);
            Assert.Equal(9596.0m, deal.Price);
            Assert.Equal("CB745436299", deal.TradeNumber);
        }
    }
}

