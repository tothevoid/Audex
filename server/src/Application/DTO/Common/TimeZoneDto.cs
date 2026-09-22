namespace Audex.Application.DTO.Common
{
    public class TimeZoneDto
    {
        public string Id { get; set; } = string.Empty;

        public string DisplayName { get; set; } = string.Empty;

        public int BaseUtcOffsetMinutes { get; set; }
    }
}
