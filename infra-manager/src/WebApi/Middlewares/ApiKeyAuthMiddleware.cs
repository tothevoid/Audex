using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace InfrastructureManager.WebApi.Middlewares
{
    public class ApiKeyAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _expectedApiKey;

        public ApiKeyAuthMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            var apiKey = configuration["INFRA_MANAGER_AUTH_KEY"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new System.InvalidOperationException("INFRA_MANAGER_AUTH_KEY environment variable is required and was not configured.");
            }
            _expectedApiKey = apiKey;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Path == "/health")
            {
                await _next(context);
                return;
            }

            if (!context.Request.Headers.TryGetValue("X-Service-Api-Key", out var providedKey))
            {
                await Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Missing X-Service-Api-Key header."
                ).ExecuteAsync(context);
                return;
            }

            var expectedBytes = Encoding.UTF8.GetBytes(_expectedApiKey);
            var providedBytes = Encoding.UTF8.GetBytes(providedKey.ToString());

            if (expectedBytes.Length != providedBytes.Length ||
                !CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes))
            {
                await Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Invalid X-Service-Api-Key."
                ).ExecuteAsync(context);
                return;
            }

            await _next(context);
        }
    }
}
