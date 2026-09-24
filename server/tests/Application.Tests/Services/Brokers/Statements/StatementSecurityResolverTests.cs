using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.DTO.Securities;
using Audex.Application.Enums.Brokers;
using Audex.Application.Integrations.Stock;
using Audex.Application.Integrations.Stock.Moex.Model;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Services.Brokers.Statements;
using Audex.Infrastructure.Entities.Securities;
using Audex.Tests.Shared.Mock;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class StatementSecurityResolverTests
    {
        [Fact]
        public void FindByIsin_MatchingIsin_ReturnsSecurityIgnoringCaseAndWhitespace()
        {
            // Arrange
            var sberSecurity = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Сбербанк",
                Ticker = "SBER",
                Isin = "RU0009029540"
            };
            var databaseSecurities = new List<Security> { sberSecurity };
            var stockConnector = new MockStockConnector();
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act
            var foundSecurity = resolver.FindByIsin("  ru0009029540  ");

            // Assert
            Assert.NotNull(foundSecurity);
            Assert.Same(sberSecurity, foundSecurity);
        }

        [Fact]
        public void FindByTicker_MatchingTicker_ReturnsSecurityIgnoringCaseAndWhitespace()
        {
            // Arrange
            var gazpSecurity = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Газпром",
                Ticker = "GAZP",
                Isin = "RU0007661625"
            };
            var databaseSecurities = new List<Security> { gazpSecurity };
            var stockConnector = new MockStockConnector();
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act
            var foundSecurity = resolver.FindByTicker("  gazp  ");

            // Assert
            Assert.NotNull(foundSecurity);
            Assert.Same(gazpSecurity, foundSecurity);
        }

        [Fact]
        public void Find_WhenBothIsinAndTickerProvided_PrefersIsinMatch()
        {
            // Arrange
            var securityMatchedByIsin = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Сбербанк",
                Ticker = "SBER",
                Isin = "RU0009029540"
            };
            var securityMatchedByTicker = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Сбербанк Преф",
                Ticker = "SBERP",
                Isin = "RU0009029557"
            };
            var databaseSecurities = new List<Security> { securityMatchedByIsin, securityMatchedByTicker };
            var stockConnector = new MockStockConnector();
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act - ISIN matches sberSecurity, ticker matches sberpSecurity
            var foundSecurity = resolver.Find("RU0009029540", "SBERP");

            // Assert
            Assert.NotNull(foundSecurity);
            Assert.Same(securityMatchedByIsin, foundSecurity);
        }

        [Fact]
        public void Find_WhenIsinDoesNotMatch_FallsBackToTicker()
        {
            // Arrange
            var yndxSecurity = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Яндекс",
                Ticker = "YDEX",
                Isin = "RU000A107T19"
            };
            var databaseSecurities = new List<Security> { yndxSecurity };
            var stockConnector = new MockStockConnector();
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act
            var foundSecurity = resolver.Find("UNKNOWN_ISIN", "YDEX");

            // Assert
            Assert.NotNull(foundSecurity);
            Assert.Same(yndxSecurity, foundSecurity);
        }

        [Theory]
        [InlineData("RU0009029540", "Сбербанк", "SBER", "isin:RU0009029540")]
        [InlineData(null, "Газпром", "GAZP", "ticker:GAZP")]
        [InlineData(null, "Лукойл", null, "name:ЛУКОЙЛ")]
        public void GetSecurityKey_ReturnsExpectedFormat(string? isin, string? name, string? ticker, string expectedKey)
        {
            // Act
            var key = StatementSecurityResolver.GetSecurityKey(isin, name, ticker);

            // Assert
            Assert.Equal(expectedKey, key);
        }

        [Fact]
        public async Task ResolveSingleSecurityAsync_WhenSecurityExistsInDatabase_ReturnsExistingStatusWithoutCallingStockConnector()
        {
            // Arrange
            var sberSecurity = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Сбербанк",
                Ticker = "SBER",
                Isin = "RU0009029540"
            };
            var databaseSecurities = new List<Security> { sberSecurity };
            var stockConnector = new MockStockConnector();
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act
            var result = await resolver.ResolveSingleSecurityAsync("RU0009029540", "SBER", "Сбербанк");

            // Assert
            Assert.Equal(StatementSecurityStatus.ExistingInDatabase, result.Status);
            Assert.Equal(sberSecurity.Id, result.ResolvedSecurityId);
            Assert.Equal("SBER", result.Ticker);
            Assert.Equal(0, stockConnector.FindCallsCount);
        }

        [Fact]
        public async Task ResolveSingleSecurityAsync_WhenNotFoundInDbOrMarket_ReturnsNotFoundInMarket()
        {
            // Arrange
            var databaseSecurities = new List<Security>();
            var stockConnector = new MockStockConnector();
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act
            var result = await resolver.ResolveSingleSecurityAsync(null, "UNKNOWN", "Неизвестная бумага");

            // Assert
            Assert.Equal(StatementSecurityStatus.NotFoundInMarket, result.Status);
            Assert.Equal("Неизвестная бумага", result.Name);
            Assert.Equal("UNKNOWN", result.Ticker);
        }

        [Fact]
        public async Task ResolveSingleSecurityAsync_WhenFoundInMarketAndMatchesDbTicker_ReturnsExistingInDatabase()
        {
            // Arrange
            var existingSecurity = new Security
            {
                Id = Guid.NewGuid(),
                Name = "Газпром ПАО",
                Ticker = "GAZP",
                Isin = "RU0007661625"
            };
            var databaseSecurities = new List<Security> { existingSecurity };
            var stockConnector = new MockStockConnector();
            stockConnector.Securities["RU0007661625"] = new MarketSecurityInfoDto
            {
                Ticker = "GAZP",
                Name = "Газпром",
                Isin = "RU0007661625"
            };
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act - statement only has ISIN, no ticker
            var result = await resolver.ResolveSingleSecurityAsync("RU0007661625", null, "Газпром");

            // Assert - found via market ticker matching existing security in DB
            Assert.Equal(StatementSecurityStatus.ExistingInDatabase, result.Status);
            Assert.Equal(existingSecurity.Id, result.ResolvedSecurityId);
            Assert.Equal("GAZP", result.Ticker);
        }

        [Fact]
        public async Task ResolveSingleSecurityAsync_WhenFoundInMarketAndNewToDb_ReturnsCanBeCreatedFromMarket()
        {
            // Arrange
            var databaseSecurities = new List<Security>();
            var stockConnector = new MockStockConnector();
            stockConnector.Securities["AFLT"] = new MarketSecurityInfoDto
            {
                Ticker = "AFLT",
                Name = "Аэрофлот",
                Isin = "RU0009062285"
            };
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            // Act
            var result = await resolver.ResolveSingleSecurityAsync(null, "AFLT", "Аэрофлот");

            // Assert
            Assert.Equal(StatementSecurityStatus.CanBeCreatedFromMarket, result.Status);
            Assert.Equal("AFLT", result.Ticker);
            Assert.Equal("RU0009062285", result.Isin);
            Assert.Equal("Аэрофлот", result.Name);
        }

        [Fact]
        public async Task ResolveSecuritiesAsync_MultipleTransactionsWithSameSecurity_DeduplicatesAndResolvesOnce()
        {
            // Arrange
            var databaseSecurities = new List<Security>();
            var stockConnector = new MockStockConnector();
            stockConnector.Securities["SBER"] = new MarketSecurityInfoDto
            {
                Ticker = "SBER",
                Name = "Сбербанк",
                Isin = "RU0009029540"
            };
            var resolver = new StatementSecurityResolver(databaseSecurities, stockConnector);

            var transactions = new List<ParsedStatementTransactionDto>
            {
                new() { Ticker = "SBER", SecurityName = "Сбербанк", Quantity = 10, Price = 250m },
                new() { Ticker = "SBER", SecurityName = "Сбербанк", Quantity = 20, Price = 255m },
                new() { Ticker = "SBER", SecurityName = "Сбербанк", Quantity = 5, Price = 260m }
            };

            // Act
            var results = await resolver.ResolveSecuritiesAsync(transactions);

            // Assert
            Assert.Single(results);
            Assert.Equal(1, stockConnector.FindCallsCount);
        }
    }
}
