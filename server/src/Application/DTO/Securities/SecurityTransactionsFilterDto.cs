using System;
using Audex.Shared.Common;

namespace Audex.Application.DTO.Securities
{
    public class SecurityTransactionsFilterDto : BasePageable
    {
        public Guid? BrokerAccountId { get; set; }

        public Guid? SecurityId { get; set; }

        public DateOnly? StartDate { get; set; }

        public DateOnly? EndDate { get; set; }
    }
}
