using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace InfrastructureManager.Application.Interfaces
{
    public interface IInfrastructureBackupService
    {
        Task WriteFullBackupToStreamAsync(Stream destinationStream, CancellationToken cancellationToken = default);

        Task RestoreFullBackupFromStreamAsync(Stream sourceStream, CancellationToken cancellationToken = default);
    }
}
