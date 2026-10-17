using System;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Entities.Securities
{
    public class SecurityPriceHistory : BaseEntity
    {
        public Guid SecurityId { get; set; }

        public Security Security { get; set; }

        public DateOnly Date { get; set; }

        public decimal ClosePrice { get; set; }

        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    }
}
