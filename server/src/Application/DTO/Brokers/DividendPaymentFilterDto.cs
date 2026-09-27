using Audex.Shared.Common;
using System;

namespace Audex.Application.DTO.Brokers
{
    public class DividendPaymentFilterDto : BasePageable
    {
        public Guid? BrokerAccountId { get; set; }
    }
}
