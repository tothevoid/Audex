using Audex.Shared.Common;
using System;

namespace Audex.Application.DTO.Debts
{
    public class DebtPaymentFilterDto : BasePageable
    {
        public Guid? DebtId { get; set; }
        public Guid? TagId { get; set; }
    }
}
