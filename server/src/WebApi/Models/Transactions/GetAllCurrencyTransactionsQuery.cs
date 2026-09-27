using Audex.Shared.Common;
using System;

namespace Audex.WebApi.Models.Transactions
{
    public class GetAllCurrencyTransactionsQuery : BasePageable
    {
        public Guid? AccountId { get; set; }
    }
}
