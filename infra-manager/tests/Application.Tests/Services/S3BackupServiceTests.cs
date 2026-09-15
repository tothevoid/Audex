using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using InfrastructureManager.Application.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Minio;
using Minio.DataModel;
using Minio.DataModel.Args;
using Minio.DataModel.Result;
using NSubstitute;
using Xunit;

namespace InfrastructureManager.Application.Tests.Services
{
    public class S3BackupServiceTests
    {
        private readonly IMinioClient _minio;
        private readonly S3BackupService _service;

        public S3BackupServiceTests()
        {
            _minio = Substitute.For<IMinioClient>();
            _service = new S3BackupService(_minio, NullLogger<S3BackupService>.Instance);
        }

        [Fact]
        public void ExcludedBuckets_Should_Contain_Backups()
        {
            S3BackupService.ExcludedBuckets.Should().Contain("backups");
            S3BackupService.ExcludedBuckets.Should().Contain("BACKUPS");
        }

        [Fact]
        public async Task ExportObjectsToArchiveAsync_Should_Skip_Excluded_Buckets()
        {
            // Arrange
            var listResult = new ListAllMyBucketsResult
            {
                Buckets = new System.Collections.ObjectModel.Collection<Bucket>
                {
                    new() { Name = "backups" },
                    new() { Name = "BACKUPS" }
                }
            };

            _minio.ListBucketsAsync(Arg.Any<CancellationToken>())
                .Returns(Task.FromResult(listResult));

            using var memoryStream = new MemoryStream();
            using var zip = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true);

            // Act
            var result = await _service.ExportObjectsToArchiveAsync(zip, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.ObjectsCount.Should().Be(0);
            result.IncludedBuckets.Should().BeEmpty();
        }

        [Fact]
        public async Task RestoreObjectsFromArchiveAsync_Should_Skip_Non_S3_Entries()
        {
            // Arrange
            using var memoryStream = new MemoryStream();
            using (var zip = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var entry = zip.CreateEntry("database.sql");
                using var writer = new StreamWriter(entry.Open());
                writer.Write("SELECT 1;");
            }
            memoryStream.Position = 0;

            using var readZip = new ZipArchive(memoryStream, ZipArchiveMode.Read);

            // Act
            await _service.RestoreObjectsFromArchiveAsync(readZip, CancellationToken.None);

            // Assert
            await _minio.DidNotReceive().PutObjectAsync(Arg.Any<PutObjectArgs>(), Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task RestoreObjectsFromArchiveAsync_Should_Create_Bucket_If_Not_Exists_And_Put_Object()
        {
            // Arrange
            using var memoryStream = new MemoryStream();
            using (var zip = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var entry = zip.CreateEntry("s3/icons/usd.png");
                using var writer = new StreamWriter(entry.Open());
                writer.Write("FAKE_IMAGE_DATA");
            }
            memoryStream.Position = 0;

            using var readZip = new ZipArchive(memoryStream, ZipArchiveMode.Read);

            _minio.BucketExistsAsync(Arg.Any<BucketExistsArgs>(), Arg.Any<CancellationToken>())
                .Returns(Task.FromResult(false));

            // Act
            await _service.RestoreObjectsFromArchiveAsync(readZip, CancellationToken.None);

            // Assert
            await _minio.Received(1).MakeBucketAsync(Arg.Any<MakeBucketArgs>(), Arg.Any<CancellationToken>());
            await _minio.Received(1).PutObjectAsync(Arg.Any<PutObjectArgs>(), Arg.Any<CancellationToken>());
        }
    }
}
