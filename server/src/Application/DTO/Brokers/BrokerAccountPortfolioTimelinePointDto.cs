using System;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountPortfolioTimelinePointDto
    {
        public DateOnly Date { get; set; }

        public decimal PortfolioValue { get; set; }

        public decimal ProfitAndLoss { get; set; }

        public decimal TotalDeposited { get; set; }

        public decimal TotalWithdrawn { get; set; }

        public decimal MainCurrencyAmount { get; set; }

        public decimal SecuritiesValue { get; set; }

        public decimal TotalDividends { get; set; }

        public decimal TotalTaxDeduction { get; set; }
    }
}
