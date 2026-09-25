using Audex.Shared.Common;

namespace Audex.WebApi.Models.Debts
{
    public class GetAllDebtPaymentsQuery : BasePageable
    {
        public System.Guid? DebtId { get; set; }
        public System.Guid? TagId { get; set; }
    }
}
