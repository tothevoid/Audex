#nullable enable
using Audex.Application.Utilities;
using Xunit;

namespace Audex.Application.Tests.Utilities
{
    public class FinancialUtilitiesTests
    {
        [Fact]
        public void CalculatePrice_WithPositiveLastPrice_ReturnsLastPrice()
        {
            Assert.Equal(75.50m, FinancialUtilities.CalculatePrice(75.50m, 74.00m));
            Assert.Equal(75.50m, FinancialUtilities.CalculatePrice(75.50m, null));
        }

        [Fact]
        public void CalculatePrice_WithNullOrZeroLastPrice_FallsBackToPreviousOrZero()
        {
            Assert.Equal(74.00m, FinancialUtilities.CalculatePrice(null, 74.00m));
            Assert.Equal(74.00m, FinancialUtilities.CalculatePrice(0m, 74.00m));
            Assert.Equal(0m, FinancialUtilities.CalculatePrice(null, null));
            Assert.Equal(10m, FinancialUtilities.CalculatePrice(null, null, 10m));
        }

        [Fact]
        public void CalculateChange_WithExplicitChange_ReturnsExplicitChange()
        {
            Assert.Equal(2.5m, FinancialUtilities.CalculateChange(100m, 95m, 2.5m));
        }

        [Fact]
        public void CalculateChange_WithoutExplicitChange_ComputesDifference()
        {
            Assert.Equal(5m, FinancialUtilities.CalculateChange(100m, 95m));
            Assert.Equal(-5m, FinancialUtilities.CalculateChange(95m, 100m));
            Assert.Equal(0m, FinancialUtilities.CalculateChange(null, 100m));
            Assert.Equal(0m, FinancialUtilities.CalculateChange(100m, null));
        }

        [Fact]
        public void CalculateChangePercent_WithExplicitChangePercent_ReturnsExplicit()
        {
            Assert.Equal(3.14m, FinancialUtilities.CalculateChangePercent(100m, 95m, 3.14m));
        }

        [Fact]
        public void CalculateChangePercent_WithoutExplicitChangePercent_ComputesPercentage()
        {
            Assert.Equal(10m, FinancialUtilities.CalculateChangePercent(110m, 100m));
            Assert.Equal(-10m, FinancialUtilities.CalculateChangePercent(90m, 100m));
            Assert.Equal(0m, FinancialUtilities.CalculateChangePercent(100m, 0m));
            Assert.Equal(0m, FinancialUtilities.CalculateChangePercent(null, 100m));
        }
    }
}
