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

        public TimeZoneInfo ResolveTimeZone(string timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
            {
                throw new ArgumentException("Time zone ID cannot be null or whitespace.", nameof(timeZoneId));
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch
            {
                if (TimeZoneInfo.TryConvertIanaIdToWindowsId(timeZoneId, out var windowsTimeZoneId))
                {
                    try
                    {
                        return TimeZoneInfo.FindSystemTimeZoneById(windowsTimeZoneId);
                    }
                    catch
                    {
                        // Fall through
                    }
                }

                if (TimeZoneInfo.TryConvertWindowsIdToIanaId(timeZoneId, out var ianaTimeZoneId))
                {
                    try
                    {
                        return TimeZoneInfo.FindSystemTimeZoneById(ianaTimeZoneId);
                    }
                    catch
                    {
                        // Fall through
                    }
                }

                throw new TimeZoneNotFoundException($"Time zone '{timeZoneId}' was not found.");
            }
        }

        public DateTime ConvertToUtc(DateTime localDateTime, TimeZoneInfo timeZone)
        {
            var unspecifiedDateTime = DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified);
            var utcOffset = timeZone.GetUtcOffset(unspecifiedDateTime);
            var dateTimeOffset = new DateTimeOffset(unspecifiedDateTime, utcOffset);
            return dateTimeOffset.UtcDateTime;
        }
    }
}
