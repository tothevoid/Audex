using System;
using Microsoft.AspNetCore.Http;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class AnalyzeBrokerStatementRequestDto
    {
        public IFormFile File { get; set; }

        public Guid BrokerAccountId { get; set; }

        public string ImporterId { get; set; }

        public string TimeZoneId { get; set; }
    }
}
