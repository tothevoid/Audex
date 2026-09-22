namespace Audex.WebApi.Models.Brokers
{
    public class BrokerAccountPortfolioModel
    {
        public decimal CurrentAmount { get; set; }

        public decimal DividendsIncome { get; set; }

        public decimal TaxDeductions { get; set; }

        public decimal ProfitAndLoss { get; set; }

        public decimal MainCurrencyAmount { get; set;}
        
        public decimal BrokerCommissions { get; set; }

        public decimal StockExchangeCommissions { get; set; }

        public decimal TransactionTaxes { get; set; }
    }
}
