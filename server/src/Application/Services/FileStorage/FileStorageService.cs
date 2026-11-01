using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.FileStorage;
using Audex.Application.Interfaces.FileStorage;
using System;
using System.Threading;
using System.Threading.Tasks;
using Minio;
using Minio.DataModel.Args;

namespace Audex.Application.Services.FileStorage
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minio;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(IMinioClient minioClient, ILogger<FileStorageService> logger = null)
        {
            _minio = minioClient;
            _logger = logger;
        }

        public async Task UploadFileAsync(string bucketName, IFormFile file, string key)
        {
            if (file == null)
            {
                return;
            }

            var existsArgs = new BucketExistsArgs().WithBucket(bucketName);
            var hasBucket = await _minio.BucketExistsAsync(existsArgs);

            if (!hasBucket)
            {
                await _minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
            }

            using var stream = file.OpenReadStream();

            string contentType;
            try
            {
                contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
            }
            catch
            {
                contentType = "application/octet-stream";
            }

            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(key)
                .WithStreamData(stream)
                .WithObjectSize(file.Length)
                .WithContentType(contentType));
        }

        public async Task UploadBytesAsync(
            string bucketName,
            byte[] data,
            string key,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (data == null || data.Length == 0)
            {
                return;
            }

            cancellationToken.ThrowIfCancellationRequested();

            var existsArgs = new BucketExistsArgs().WithBucket(bucketName);
            var hasBucket = await _minio.BucketExistsAsync(existsArgs, cancellationToken);

            if (!hasBucket)
            {
                cancellationToken.ThrowIfCancellationRequested();
                await _minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName), cancellationToken);
            }

            cancellationToken.ThrowIfCancellationRequested();
            using var stream = new System.IO.MemoryStream(data);

            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(key)
                .WithStreamData(stream)
                .WithObjectSize(data.Length)
                .WithContentType(string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType), cancellationToken);
        }

        public async Task<FileStreamDto> GetFileStreamAsync(string bucketName, string key)
        {
            if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(key))
            {
                return null;
            }

            var memoryStream = new System.IO.MemoryStream();
            string contentType = "application/octet-stream";

            try
            {
                var statArgs = new StatObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(key);

                var stat = await _minio.StatObjectAsync(statArgs);
                if (stat != null && !string.IsNullOrWhiteSpace(stat.ContentType))
                {
                    contentType = stat.ContentType;
                }

                var getArgs = new GetObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(key)
                    .WithCallbackStream(stream =>
                    {
                        stream.CopyTo(memoryStream);
                    });

                await _minio.GetObjectAsync(getArgs);
                memoryStream.Position = 0;

                return new FileStreamDto
                {
                    Stream = memoryStream,
                    ContentType = contentType
                };
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to get file stream for bucket '{BucketName}' and key '{Key}'", bucketName, key);
                return null;
            }
        }

        public async Task<string> GetFileUrlAsync(string bucketName, string key)
        {
            return await _minio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(key)
                .WithExpiry(60 * 60));
        }

        public async Task DeleteFileAsync(string bucketName, string key)
        {
            if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(key))
            {
                return;
            }

            var existsArgs = new BucketExistsArgs().WithBucket(bucketName);
            var hasBucket = await _minio.BucketExistsAsync(existsArgs);
            if (!hasBucket)
            {
                return;
            }

            await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(bucketName)
                .WithObject(key));
        }
    }
}
