using System;

namespace Audex.WebApi.Models.Accounts
{
    public class AccountGetAllConfig
    {
        public bool OnlyActive { get; set; }
        public Guid? CurrencyId { get; set; }
        public Guid? AccountTypeId { get; set; }
    }
}
