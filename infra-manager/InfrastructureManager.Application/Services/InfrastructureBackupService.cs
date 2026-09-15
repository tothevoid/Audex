#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using InfrastructureManager.Application.DTO;
using InfrastructureManager.Application.Interfaces;

namespace InfrastructureManager.Application.Services
{
    public class InfrastructureBackupService : IInfrastructureBackupService
    {
        public const string DatabaseDumpFileName = "database.sql";
        public const string ManifestFileName = "manifest.json";
        public const string DefaultAppName = "Audex";

        private readonly IPostgresBackupService _postgresBackupService;
        private readonly IS3BackupService _s3BackupService;
        private readonly ILogger<InfrastructureBackupService> _logger;

        public InfrastructureBackupService(
            IPostgresBackupService postgresBackupService,
            IS3BackupService s3BackupService,
            ILogger<InfrastructureBackupService> logger)
        {
            _postgresBackupService = postgresBackupService;
            _s3BackupService = s3BackupService;
            _logger = logger;
        }

        public async Task WriteFullBackupToStreamAsync(Stream destinationStream, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Starting full infrastructure backup creation (PostgreSQL + S3)...");

            using (var zip = new ZipArchive(destinationStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                // 1. Export PostgreSQL database dump
                _logger.LogInformation("Exporting PostgreSQL database dump to {FileName}...", DatabaseDumpFileName);
                var dbEntry = zip.CreateEntry(DatabaseDumpFileName, CompressionLevel.Optimal);
                using (var dbStream = dbEntry.Open())
                {
                    await _postgresBackupService.WriteDumpToStreamAsync(dbStream, cancellationToken);
                }

                // 2. Export S3 files into s3/{bucket}/{key}
                _logger.LogInformation("Exporting S3 objects...");
                var s3ExportResult = await _s3BackupService.ExportObjectsToArchiveAsync(zip, cancellationToken);

                // 3. Write manifest.json
                _logger.LogInformation("Writing {ManifestFile}", ManifestFileName);
                var manifest = new BackupManifestDto
                {
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    AppName = DefaultAppName,
                    IncludedBuckets = s3ExportResult.IncludedBuckets,
                    S3ObjectsCount = s3ExportResult.ObjectsCount,
                    DatabaseDumpFileName = DatabaseDumpFileName
                };

                var manifestEntry = zip.CreateEntry(ManifestFileName, CompressionLevel.Optimal);
                using (var manifestStream = manifestEntry.Open())
                {
                    await JsonSerializer.SerializeAsync(manifestStream, manifest, cancellationToken: cancellationToken);
                }
            }

            _logger.LogInformation("Full infrastructure backup successfully written to stream.");
        }

        public async Task RestoreFullBackupFromStreamAsync(Stream sourceStream, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Starting full infrastructure restore (PostgreSQL + S3)...");

            using var memoryStream = new MemoryStream();
            await sourceStream.CopyToAsync(memoryStream, cancellationToken);
            memoryStream.Position = 0;

            using var zip = new ZipArchive(memoryStream, ZipArchiveMode.Read);

            // 1. Verify manifest
            var manifestEntry = zip.GetEntry(ManifestFileName)
                ?? throw new InvalidOperationException($"Invalid backup bundle: {ManifestFileName} is missing.");

            using (var manifestStream = manifestEntry.Open())
            {
                var manifest = await JsonSerializer.DeserializeAsync<BackupManifestDto>(manifestStream, cancellationToken: cancellationToken);
                if (manifest == null)
                {
                    throw new InvalidOperationException($"Failed to read {ManifestFileName} from backup bundle.");
                }
                _logger.LogInformation("Restoring backup created at {CreatedAt} for app {App} with {Count} S3 objects...",
                    manifest.CreatedAt, manifest.AppName, manifest.S3ObjectsCount);
            }

            // 2. Restore PostgreSQL database
            var dbEntry = zip.GetEntry(DatabaseDumpFileName)
                ?? throw new InvalidOperationException($"Invalid backup bundle: {DatabaseDumpFileName} is missing.");

            _logger.LogInformation("Restoring PostgreSQL database from {EntryName}...", dbEntry.FullName);
            using (var dbStream = dbEntry.Open())
            {
                await _postgresBackupService.RestoreDumpFromStreamAsync(dbStream, cancellationToken);
            }

            // 3. Restore S3 objects
            _logger.LogInformation("Restoring S3 objects...");
            await _s3BackupService.RestoreObjectsFromArchiveAsync(zip, cancellationToken);

            _logger.LogInformation("Full infrastructure restore completed successfully.");
        }
    }
}
