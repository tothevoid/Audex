using System;
using System.IO;
using System.IO.Compression;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using InfrastructureManager.Application.DTO;
using InfrastructureManager.Application.Interfaces;
using InfrastructureManager.Application.Services;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace InfrastructureManager.Application.Tests.Services
{
    public class InfrastructureBackupServiceTests
    {
        private readonly IPostgresBackupService _postgresBackupService;
        private readonly IS3BackupService _s3BackupService;
        private readonly InfrastructureBackupService _service;

        public InfrastructureBackupServiceTests()
        {
            _postgresBackupService = Substitute.For<IPostgresBackupService>();
            _s3BackupService = Substitute.For<IS3BackupService>();
            _service = new InfrastructureBackupService(
                _postgresBackupService,
                _s3BackupService,
                NullLogger<InfrastructureBackupService>.Instance);
        }

        [Fact]
        public async Task WriteFullBackupToStreamAsync_Should_Create_Valid_Zip_With_Sql_Manifest_And_S3()
        {
            // Arrange
            _postgresBackupService.When(x => x.WriteDumpToStreamAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>()))
                .Do(callInfo =>
                {
                    var stream = callInfo.Arg<Stream>();
                    using var writer = new StreamWriter(stream, leaveOpen: true);
                    writer.Write("DUMP_SQL_CONTENT");
                });

            _s3BackupService.ExportObjectsToArchiveAsync(Arg.Any<ZipArchive>(), Arg.Any<CancellationToken>())
                .Returns(Task.FromResult(new S3ExportResultDto
                {
                    ObjectsCount = 5,
                    IncludedBuckets = new System.Collections.Generic.List<string> { "icons" }
                }));

            using var memoryStream = new MemoryStream();

            // Act
            await _service.WriteFullBackupToStreamAsync(memoryStream, CancellationToken.None);

            // Assert
            memoryStream.Length.Should().BeGreaterThan(0);
            memoryStream.Position = 0;

            using var zip = new ZipArchive(memoryStream, ZipArchiveMode.Read);
            var dbEntry = zip.GetEntry(InfrastructureBackupService.DatabaseDumpFileName);
            dbEntry.Should().NotBeNull();
            using (var reader = new StreamReader(dbEntry!.Open()))
            {
                var content = await reader.ReadToEndAsync();
                content.Should().Be("DUMP_SQL_CONTENT");
            }

            var manifestEntry = zip.GetEntry(InfrastructureBackupService.ManifestFileName);
            manifestEntry.Should().NotBeNull();
            using (var manifestStream = manifestEntry!.Open())
            {
                var manifest = await JsonSerializer.DeserializeAsync<BackupManifestDto>(manifestStream);
                manifest.Should().NotBeNull();
                manifest!.Version.Should().Be(1);
                manifest.AppName.Should().Be(InfrastructureBackupService.DefaultAppName);
                manifest.S3ObjectsCount.Should().Be(5);
                manifest.IncludedBuckets.Should().ContainSingle("icons");
                manifest.DatabaseDumpFileName.Should().Be(InfrastructureBackupService.DatabaseDumpFileName);
            }

            await _postgresBackupService.Received(1).WriteDumpToStreamAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>());
            await _s3BackupService.Received(1).ExportObjectsToArchiveAsync(Arg.Any<ZipArchive>(), Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task RestoreFullBackupFromStreamAsync_Should_Restore_Database_And_S3()
        {
            // Arrange
            using var bundleStream = new MemoryStream();
            using (var zip = new ZipArchive(bundleStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var manifest = new BackupManifestDto
                {
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    AppName = "Audex",
                    S3ObjectsCount = 3,
                    DatabaseDumpFileName = "database.sql"
                };
                var mEntry = zip.CreateEntry("manifest.json");
                using (var ms = mEntry.Open())
                {
                    await JsonSerializer.SerializeAsync(ms, manifest);
                }

                var dbEntry = zip.CreateEntry("database.sql");
                using (var writer = new StreamWriter(dbEntry.Open()))
                {
                    writer.Write("RESTORE_SQL");
                }
            }
            bundleStream.Position = 0;

            // Act
            await _service.RestoreFullBackupFromStreamAsync(bundleStream, CancellationToken.None);

            // Assert
            await _postgresBackupService.Received(1).RestoreDumpFromStreamAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>());
            await _s3BackupService.Received(1).RestoreObjectsFromArchiveAsync(Arg.Any<ZipArchive>(), Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task RestoreFullBackupFromStreamAsync_Should_Throw_When_Manifest_Is_Missing()
        {
            // Arrange
            using var bundleStream = new MemoryStream();
            using (var zip = new ZipArchive(bundleStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var dbEntry = zip.CreateEntry("database.sql");
                using var writer = new StreamWriter(dbEntry.Open());
                writer.Write("RESTORE_SQL");
            }
            bundleStream.Position = 0;

            // Act
            Func<Task> act = async () => await _service.RestoreFullBackupFromStreamAsync(bundleStream, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*manifest.json is missing*");
        }

        [Fact]
        public async Task RestoreFullBackupFromStreamAsync_Should_Throw_When_Database_Dump_Is_Missing()
        {
            // Arrange
            using var bundleStream = new MemoryStream();
            using (var zip = new ZipArchive(bundleStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var manifest = new BackupManifestDto
                {
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    AppName = "Audex"
                };
                var mEntry = zip.CreateEntry("manifest.json");
                using var ms = mEntry.Open();
                await JsonSerializer.SerializeAsync(ms, manifest);
            }
            bundleStream.Position = 0;

            // Act
            Func<Task> act = async () => await _service.RestoreFullBackupFromStreamAsync(bundleStream, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*database.sql is missing*");
        }
    }
}
