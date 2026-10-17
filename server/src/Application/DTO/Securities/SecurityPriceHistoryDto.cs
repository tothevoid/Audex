using System;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.Securities
{
    public class SecurityPriceHistoryDto : BaseEntity
    {
        public Guid SecurityId { get; set; }

        public DateOnly Date { get; set; }

        public decimal ClosePrice { get; set; }

        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    }
}
