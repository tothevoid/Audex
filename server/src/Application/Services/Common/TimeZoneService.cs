using System;
using System.Collections.Generic;
using System.Linq;
using Audex.Application.DTO.Common;
using Audex.Application.Interfaces.Common;

namespace Audex.Application.Services.Common
{
    public class TimeZoneService : ITimeZoneService
    {
        public IReadOnlyList<TimeZoneDto> GetTimeZones()
        {
            var systemTimeZones = TimeZoneInfo.GetSystemTimeZones();
            var timeZones = new List<TimeZoneDto>();

            foreach (var timeZoneInfo in systemTimeZones)
            {
                string timeZoneId = timeZoneInfo.Id;
                if (TimeZoneInfo.TryConvertWindowsIdToIanaId(timeZoneInfo.Id, out var ianaId) && !string.IsNullOrEmpty(ianaId))
                {
                    timeZoneId = ianaId;
                }

                timeZones.Add(new TimeZoneDto
                {
                    Id = timeZoneId,
                    DisplayName = timeZoneInfo.DisplayName,
                    BaseUtcOffsetMinutes = (int)timeZoneInfo.BaseUtcOffset.TotalMinutes
                });
            }

            return timeZones
                .GroupBy(timeZone => timeZone.Id, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .OrderBy(timeZone => timeZone.BaseUtcOffsetMinutes)
                .ThenBy(timeZone => timeZone.DisplayName)
                .ToList();
        }
    }
}
