#nullable enable

namespace InfrastructureManager.Application.DTO
{
    public class BackupValidationResultDto
    {
        public bool IsValid { get; set; }

        public string? ErrorMessage { get; set; }
    }
}
