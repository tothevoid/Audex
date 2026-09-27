using System;
using Audex.Shared.Common;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountFundsTransferFilterDto : BasePageable
    {
        public Guid? BrokerAccountId { get; set; }
    }
}
