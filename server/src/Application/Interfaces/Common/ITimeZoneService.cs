using System;
using System.Collections.Generic;
using Audex.Application.DTO.Common;

namespace Audex.Application.Interfaces.Common
{
    public interface ITimeZoneService
    {
        IReadOnlyList<TimeZoneDto> GetTimeZones();

        TimeZoneInfo ResolveTimeZone(string timeZoneId);

        DateTime ConvertToUtc(DateTime localDateTime, TimeZoneInfo timeZone);
    }
}
