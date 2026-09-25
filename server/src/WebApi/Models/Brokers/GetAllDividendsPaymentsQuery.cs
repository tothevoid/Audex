using Audex.Shared.Common;
using System;

namespace Audex.WebApi.Models.Brokers
{
    public class GetAllDividendsPaymentsQuery : BasePageable
    {
        public Guid? BrokerAccountId { get; set; }
    }
}
