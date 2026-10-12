#nullable enable

namespace Audex.Application.DTO.Notifications
{
    public enum ServerToastType
    {
        Info = 0,
        Success = 1,
        Warning = 2,
        Error = 3
    }

    public class ServerToastDto
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public ServerToastType Type { get; set; } = ServerToastType.Info;

        public string? ActionLabel { get; set; }

        public string? ActionUrl { get; set; }

        public int? Duration { get; set; }
    }
}
