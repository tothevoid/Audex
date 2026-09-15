using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Audex.Infrastructure.Interfaces.DatabaseBackup;

namespace Audex.Tests.Shared
{
    public class TestDatabaseBackupProvider : IDatabaseBackupProvider
    {
        public Task<byte[]> ExportDatabaseDumpAsync(CancellationToken cancellationToken = default)
        {
            using var ms = new MemoryStream();
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
            {
                var manifestEntry = zip.CreateEntry("manifest.json");
                using (var writer = new StreamWriter(manifestEntry.Open(), Encoding.UTF8))
                {
                    writer.Write("{\"version\":2,\"appName\":\"Audex\"}");
                }

                var dbEntry = zip.CreateEntry("database.sql");
                using (var writer = new StreamWriter(dbEntry.Open(), Encoding.UTF8))
                {
                    writer.Write("CREATE TABLE test(); INSERT INTO test VALUES (1);");
                }
            }

            return Task.FromResult(ms.ToArray());
        }

        public Task ImportDatabaseDumpAsync(byte[] dumpData, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task<DatabaseDumpValidationResultDto> ValidateDatabaseDumpAsync(byte[] dumpData, CancellationToken cancellationToken = default)
        {
            try
            {
                using var ms = new MemoryStream(dumpData);
                using var zip = new ZipArchive(ms, ZipArchiveMode.Read);
                var manifestEntry = zip.GetEntry("manifest.json");
                var dbEntry = zip.GetEntry("database.sql");

                if (manifestEntry == null || dbEntry == null)
                {
                    return Task.FromResult(new DatabaseDumpValidationResultDto
                    {
                        IsValid = false,
                        ErrorMessage = "Invalid test backup archive: missing manifest.json or database.sql."
                    });
                }

                return Task.FromResult(new DatabaseDumpValidationResultDto
                {
                    IsValid = true,
                    ErrorMessage = null
                });
            }
            catch (Exception ex)
            {
                return Task.FromResult(new DatabaseDumpValidationResultDto
                {
                    IsValid = false,
                    ErrorMessage = ex.Message
                });
            }
        }
    }
}
