#nullable enable
using System.Threading;
using System.Threading.Tasks;

namespace Audex.Infrastructure.Interfaces.DatabaseBackup
{
    public interface IDatabaseBackupProvider
    {
        Task<byte[]> ExportDatabaseDumpAsync(CancellationToken cancellationToken = default);
        Task ImportDatabaseDumpAsync(byte[] dumpData, CancellationToken cancellationToken = default);
        Task<DatabaseDumpValidationResultDto> ValidateDatabaseDumpAsync(byte[] dumpData, CancellationToken cancellationToken = default);
    }
}
