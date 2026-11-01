using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.FileStorage;

namespace Audex.Application.Interfaces.FileStorage
{
    public interface IFileStorageService
    {
        Task UploadFileAsync(string bucketName, IFormFile file, string key);

        Task UploadBytesAsync(string bucketName, byte[] data, string key, string contentType, CancellationToken cancellationToken = default);

        Task<FileStreamDto> GetFileStreamAsync(string bucketName, string key);

        Task<string> GetFileUrlAsync(string bucketName, string key);

        Task DeleteFileAsync(string bucketName, string key);
    }
}
