#nullable enable
using System.Net;

namespace Audex.Application.Integrations.Common
{
    public class IntegrationApiResponse<T>
    {
        public bool IsSuccess { get; set; }

        public HttpStatusCode? StatusCode { get; set; }

        public string? ErrorMessage { get; set; }

        public string? ErrorCode { get; set; }

        public T? Data { get; set; }

        public static IntegrationApiResponse<T> Success(T data) => new()
        {
            IsSuccess = true,
            StatusCode = HttpStatusCode.OK,
            Data = data
        };

        public static IntegrationApiResponse<T> Failure(
            HttpStatusCode? statusCode,
            string? errorMessage = null,
            string? errorCode = null) => new()
        {
            IsSuccess = false,
            StatusCode = statusCode,
            ErrorMessage = errorMessage,
            ErrorCode = errorCode
        };

        public static IntegrationApiResponse<T> NotFound(
            string? errorMessage = null,
            string? errorCode = null) => new()
        {
            IsSuccess = false,
            StatusCode = HttpStatusCode.NotFound,
            ErrorMessage = errorMessage,
            ErrorCode = errorCode
        };
    }
}
