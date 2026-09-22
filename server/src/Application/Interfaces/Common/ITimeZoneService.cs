using System.Collections.Generic;
using Audex.Application.DTO.Common;

namespace Audex.Application.Interfaces.Common
{
    public interface ITimeZoneService
    {
        IReadOnlyList<TimeZoneDto> GetTimeZones();
    }
}
