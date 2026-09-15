#nullable enable

namespace Audex.Infrastructure.Interfaces.DatabaseBackup
{
    public class DatabaseDumpValidationResultDto
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
