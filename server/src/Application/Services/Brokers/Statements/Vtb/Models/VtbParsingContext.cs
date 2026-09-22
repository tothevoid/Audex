#nullable enable
using System;
using Audex.Application.Interfaces.Common;

namespace Audex.Application.Services.Brokers.Statements.Vtb.Models
{
    public sealed class VtbParsingContext
    {
        public TimeZoneInfo TimeZone { get; init; } = TimeZoneInfo.Utc;
        public ITimeZoneService TimeZoneService { get; init; } = null!;
        public bool IsCurrencyTable { get; init; }
    }
}
