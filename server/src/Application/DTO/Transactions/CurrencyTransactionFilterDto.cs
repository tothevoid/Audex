using Audex.Shared.Common;
using System;

namespace Audex.Application.DTO.Transactions
{
    public class CurrencyTransactionFilterDto : BasePageable
    {
        public Guid? AccountId { get; set; }
    }
}
