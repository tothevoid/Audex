#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;
using InfrastructureManager.Application.DTO;
using InfrastructureManager.Application.Interfaces;
using Minio;
using Minio.DataModel.Args;

namespace InfrastructureManager.Application.Services
{
    public class S3BackupService : IS3BackupService
    {
        private readonly IMinioClient _minio;
        private readonly ILogger<S3BackupService> _logger;

        // System bucket that stores historical backups - must NEVER be included in backups
        public static readonly HashSet<string> ExcludedBuckets = new(StringComparer.OrdinalIgnoreCase)
        {
            "backups"
        };

        public S3BackupService(
            IMinioClient minio,
            ILogger<S3BackupService> logger)
        {
            _minio = minio;
            _logger = logger;
        }

        public async Task<S3ExportResultDto> ExportObjectsToArchiveAsync(
            ZipArchive zip,
            CancellationToken cancellationToken = default)
        {
            var totalCount = 0;
            var includedBuckets = new List<string>();

            try
            {
                var bucketList = await _minio.ListBucketsAsync(cancellationToken);

                foreach (var bucket in bucketList.Buckets)
                {
                    if (ExcludedBuckets.Contains(bucket.Name))
                    {
                        _logger.LogInformation("Skipping excluded backup bucket '{BucketName}'", bucket.Name);
                        continue;
                    }

                    includedBuckets.Add(bucket.Name);
                    _logger.LogInformation("Exporting S3 bucket '{BucketName}' to backup archive...", bucket.Name);

                    var listArgs = new ListObjectsArgs()
                        .WithBucket(bucket.Name)
                        .WithRecursive(true);

                    await foreach (var item in _minio.ListObjectsEnumAsync(listArgs, cancellationToken))
                    {
                        if (item.IsDir)
                        {
                            continue;
                        }

                        var entryName = $"s3/{bucket.Name}/{item.Key}";
                        var entry = zip.CreateEntry(entryName, CompressionLevel.Optimal);

                        using (var entryStream = entry.Open())
                        {
                            var getArgs = new GetObjectArgs()
                                .WithBucket(bucket.Name)
                                .WithObject(item.Key)
                                .WithCallbackStream(stream => stream.CopyTo(entryStream));

                            await _minio.GetObjectAsync(getArgs, cancellationToken);
                        }

                        totalCount++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export S3 objects to backup archive.");
                throw;
            }

            return new S3ExportResultDto
            {
                ObjectsCount = totalCount,
                IncludedBuckets = includedBuckets
            };
        }

        public async Task RestoreObjectsFromArchiveAsync(
            ZipArchive zip,
            CancellationToken cancellationToken = default)
        {
            var restoredBuckets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var entry in zip.Entries)
            {
                var parts = entry.FullName.Split('/', 3);
                if (parts.Length < 3 || !parts[0].Equals("s3", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var bucketName = parts[1];
                var objectKey = parts[2];

                if (string.IsNullOrWhiteSpace(bucketName) || string.IsNullOrWhiteSpace(objectKey))
                {
                    continue;
                }

                // Ensure bucket exists
                if (!restoredBuckets.Contains(bucketName))
                {
                    var existsArgs = new BucketExistsArgs().WithBucket(bucketName);
                    var hasBucket = await _minio.BucketExistsAsync(existsArgs, cancellationToken);
                    if (!hasBucket)
                    {
                        _logger.LogInformation("Creating missing S3 bucket '{BucketName}' during restore...", bucketName);
                        await _minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName), cancellationToken);
                    }
                    restoredBuckets.Add(bucketName);
                }

                using var entryStream = entry.Open();
                using var memoryStream = new MemoryStream();
                await entryStream.CopyToAsync(memoryStream, cancellationToken);
                memoryStream.Position = 0;

                var contentType = GetContentType(objectKey);

                await _minio.PutObjectAsync(new PutObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(objectKey)
                    .WithStreamData(memoryStream)
                    .WithObjectSize(memoryStream.Length)
                    .WithContentType(contentType), cancellationToken);

                _logger.LogDebug("Restored S3 object '{Bucket}/{Key}' ({Size} bytes)", bucketName, objectKey, memoryStream.Length);
            }
        }

        private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

        private static string GetContentType(string key)
        {
            return ContentTypeProvider.TryGetContentType(key, out var contentType)
                ? contentType
                : "application/octet-stream";
        }
    }
}
