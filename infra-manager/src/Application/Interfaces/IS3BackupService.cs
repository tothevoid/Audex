using System.IO.Compression;
using System.Threading;
using System.Threading.Tasks;
using InfrastructureManager.Application.DTO;

namespace InfrastructureManager.Application.Interfaces
{
    public interface IS3BackupService
    {
        Task<S3ExportResultDto> ExportObjectsToArchiveAsync(ZipArchive zip, CancellationToken cancellationToken = default);

        Task RestoreObjectsFromArchiveAsync(ZipArchive zip, CancellationToken cancellationToken = default);
    }
}
