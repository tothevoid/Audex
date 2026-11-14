namespace Audex.WebApi.Models.Transactions
{
    public class TransactionSummaryModel
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalCashback { get; set; }
        public decimal NetExpenses { get; set; }
        public decimal NetBalance { get; set; }
        public decimal DailyAverageExpense { get; set; }
        public string CurrencyName { get; set; } = string.Empty;
    }
}

