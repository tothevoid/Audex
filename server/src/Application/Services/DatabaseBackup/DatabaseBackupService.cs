#nullable enable
using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.DatabaseBackup;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Infrastructure.Interfaces.DatabaseBackup;

namespace Audex.Application.Services.DatabaseBackup
{
    public class DatabaseBackupService : IDatabaseBackupService
    {
        private readonly IDatabaseBackupProvider _databaseBackupProvider;
        private readonly IBackupEncryptionService _backupEncryptionService;
        private readonly IDatabaseStateService _databaseStateService;
        private readonly ILogger<DatabaseBackupService> _logger;

        public DatabaseBackupService(
            IDatabaseBackupProvider databaseBackupProvider,
            IBackupEncryptionService backupEncryptionService,
            IDatabaseStateService databaseStateService,
            ILogger<DatabaseBackupService> logger)
        {
            _databaseBackupProvider = databaseBackupProvider;
            _backupEncryptionService = backupEncryptionService;
            _databaseStateService = databaseStateService;
            _logger = logger;
        }

        public async Task<GeneratedBackupDto> CreateBackupAsync(string? password = null)
        {
            var rawDumpBytes = await _databaseBackupProvider.ExportDatabaseDumpAsync();
            var compressedBytes = CompressGzip(rawDumpBytes);
            var isEncrypted = !string.IsNullOrEmpty(password);

            var data = isEncrypted
                ? await _backupEncryptionService.EncryptAsync(compressedBytes, password!)
                : compressedBytes;

            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var fileName = isEncrypted
                ? $"audex_backup_{timestamp}.audexbackup"
                : $"audex_backup_{timestamp}.sql.gz";

            return new GeneratedBackupDto
            {
                Data = data,
                FileName = fileName,
                ContentType = isEncrypted ? "application/octet-stream" : "application/gzip",
                IsEncrypted = isEncrypted
            };
        }

        public async Task<BackupValidationResultDto> ValidateBackupAsync(byte[] backupData, string? password = null)
        {
            if (backupData == null || backupData.Length == 0)
            {
                return new BackupValidationResultDto
                {
                    IsValid = false,
                    ErrorMessage = "Backup data is empty."
                };
            }

            var isEncrypted = _backupEncryptionService.IsEncryptedBackup(backupData);

            if (isEncrypted && string.IsNullOrEmpty(password))
            {
                return new BackupValidationResultDto
                {
                    IsValid = true,
                    IsEncrypted = true,
                    ErrorMessage = null
                };
            }

            try
            {
                byte[] rawZipBytes;
                if (isEncrypted)
                {
                    rawZipBytes = await _backupEncryptionService.DecryptAsync(backupData, password!);
                }
                else
                {
                    rawZipBytes = backupData;
                }

                var validationResult = await _databaseBackupProvider.ValidateDatabaseDumpAsync(rawZipBytes);

                return new BackupValidationResultDto
                {
                    IsValid = validationResult.IsValid,
                    IsEncrypted = isEncrypted,
                    ErrorMessage = validationResult.ErrorMessage
                };
            }
            catch (Exception ex)
            {
                return new BackupValidationResultDto
                {
                    IsValid = false,
                    IsEncrypted = isEncrypted,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<RestoreBackupResultDto> RestoreBackupAsync(byte[] backupData, string? password = null)
        {
            if (backupData == null || backupData.Length == 0)
            {
                return new RestoreBackupResultDto
                {
                    Success = false,
                    Message = "Backup data is empty."
                };
            }

            var isEncrypted = _backupEncryptionService.IsEncryptedBackup(backupData);
            byte[] rawCompressed;

            try
            {
                if (isEncrypted)
                {
                    if (string.IsNullOrEmpty(password))
                    {
                        return new RestoreBackupResultDto
                        {
                            Success = false,
                            Message = "Password is required for encrypted backup."
                        };
                    }

                    rawCompressed = await _backupEncryptionService.DecryptAsync(backupData, password);
                }
                else
                {
                    rawCompressed = backupData;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to decrypt backup data during restore.");
                return new RestoreBackupResultDto
                {
                    Success = false,
                    Message = $"Decryption failed: {ex.Message}"
                };
            }

            byte[] rawDumpBytes;
            try
            {
                rawDumpBytes = DecompressGzip(rawCompressed);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to decompress backup data during restore.");
                return new RestoreBackupResultDto
                {
                    Success = false,
                    Message = $"Decompression failed: {ex.Message}"
                };
            }

            // Acquire exclusive maintenance lock through state service
            using (await _databaseStateService.BeginRestoreScopeAsync())
            {
                try
                {
                    await _databaseBackupProvider.ImportDatabaseDumpAsync(rawDumpBytes);

                    return new RestoreBackupResultDto
                    {
                        Success = true,
                        Message = "Database restored successfully from full PostgreSQL dump."
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Full database restore failed.");

                    return new RestoreBackupResultDto
                    {
                        Success = false,
                        Message = $"Database restore failed: {ex.Message}"
                    };
                }
            }
        }

        private static byte[] CompressGzip(byte[] data)
        {
            using var output = new MemoryStream();
            using (var gzip = new GZipStream(output, CompressionLevel.Optimal, leaveOpen: true))
            {
                gzip.Write(data, 0, data.Length);
            }
            return output.ToArray();
        }

        private static byte[] DecompressGzip(byte[] data)
        {
            using var input = new MemoryStream(data);
            using var gzip = new GZipStream(input, CompressionMode.Decompress);
            using var output = new MemoryStream();
            gzip.CopyTo(output);
            return output.ToArray();
        }
    }
}
