using Audex.Shared.Common;
using System;

namespace Audex.WebApi.Models.Brokers
{
    public class GetAllBrokerAccountFundTransferQuery : BasePageable
    {
        public Guid? BrokerAccountId { get; set; }
    }
}
