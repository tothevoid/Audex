using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace InfrastructureManager.Application.Interfaces
{
    public interface IPostgresBackupService
    {
        Task WriteDumpToStreamAsync(Stream destinationStream, CancellationToken cancellationToken = default);
        Task RestoreDumpFromStreamAsync(Stream sourceStream, CancellationToken cancellationToken = default);
    }
}
