using System;

namespace Audex.Application.DTO.Brokers
{
    public class BrokerAccountPortfolioDateBoundsDto
    {
        public DateOnly? MinDate { get; set; }

        public DateOnly? MaxDate { get; set; }
    }
}
