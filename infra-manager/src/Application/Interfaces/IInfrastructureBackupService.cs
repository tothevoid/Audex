using System.IO;
using System.Threading;
using System.Threading.Tasks;
using InfrastructureManager.Application.DTO;

namespace InfrastructureManager.Application.Interfaces
{
    public interface IInfrastructureBackupService
    {
        Task WriteFullBackupToStreamAsync(Stream destinationStream, CancellationToken cancellationToken = default);

        Task RestoreFullBackupFromStreamAsync(Stream sourceStream, CancellationToken cancellationToken = default);

        Task<BackupValidationResultDto> ValidateBackupFromStreamAsync(Stream sourceStream, CancellationToken cancellationToken = default);
    }
}
