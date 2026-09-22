#nullable enable
using System.Text.Json.Serialization;

namespace Audex.Application.DTO.Common
{
    public class OperationResultDto<T>
    {
        [JsonPropertyName("isSuccess")]
        public bool IsSuccess { get; set; }

        [JsonPropertyName("data")]
        public T? Data { get; set; }

        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }

        [JsonPropertyName("errorCode")]
        public string? ErrorCode { get; set; }

        public static OperationResultDto<T> Success(T data) => new()
        {
            IsSuccess = true,
            Data = data
        };

        public static OperationResultDto<T> Failure(string errorMessage, string? errorCode = null) => new()
        {
            IsSuccess = false,
            ErrorMessage = errorMessage,
            ErrorCode = errorCode
        };
    }
}
