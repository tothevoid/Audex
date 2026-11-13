namespace Audex.WebApi.Models.Transactions
{
    public class GetTransactionsQuery
    {
        public int? Month { get; set; }

        public int Year { get; set; }

        public bool ShowSystem { get; set; }
    }
}

