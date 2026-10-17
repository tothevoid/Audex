using System;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountPortfolioRangeFilterDto
    {
        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public Guid? BrokerAccountId { get; set; }
    }
}
