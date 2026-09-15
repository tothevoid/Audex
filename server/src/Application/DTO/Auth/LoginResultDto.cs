#nullable enable
namespace Audex.Application.DTO.Auth
{
    public class LoginResultDto
    {
        public bool IsSuccess { get; set; }

        public LoginResponseDto? Data { get; set; }

        public string? ErrorMessage { get; set; }

        public static LoginResultDto Success(LoginResponseDto data)
        {
            return new LoginResultDto
            {
                IsSuccess = true,
                Data = data
            };
        }

        public static LoginResultDto Failure(string errorMessage)
        {
            return new LoginResultDto
            {
                IsSuccess = false,
                ErrorMessage = errorMessage
            };
        }
    }
}
