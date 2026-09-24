using System.Collections.Generic;
using Audex.Application.Services.Brokers.Statements;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class BrokerStatementImporterRegistryTests
    {
        [Fact]
        public void Registry_Should_Scan_And_Register_Vtb_Importer()
        {
            // Arrange & Act
            var registry = new BrokerStatementImporterRegistry();

            // Assert
            var importers = registry.GetAll();
            Assert.NotEmpty(importers);
            Assert.Contains(importers, importer => importer.Id == "vtb");
        }

        [Fact]
        public void GetById_Should_Return_Vtb_Importer()
        {
            // Arrange
            var registry = new BrokerStatementImporterRegistry();

            // Act
            var importer = registry.GetById("vtb");

            // Assert
            Assert.NotNull(importer);
            Assert.Equal("vtb", importer.Id);
            Assert.Contains(".xlsx", importer.SupportedExtensions);
        }

        [Fact]
        public void TryGetById_Should_Return_False_For_NonExisting_Id()
        {
            // Arrange
            var registry = new BrokerStatementImporterRegistry();

            // Act
            var found = registry.TryGetById("unknown_importer", out var importer);

            // Assert
            Assert.False(found);
            Assert.Null(importer);
        }

        [Fact]
        public void GetById_Should_Throw_KeyNotFoundException_For_Unknown_Id()
        {
            // Arrange
            var registry = new BrokerStatementImporterRegistry();

            // Act & Assert
            Assert.Throws<KeyNotFoundException>(() => registry.GetById("non_existing"));
        }
    }
}
