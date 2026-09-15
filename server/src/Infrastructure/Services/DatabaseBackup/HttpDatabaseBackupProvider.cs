#nullable enable
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Audex.Infrastructure.Interfaces.DatabaseBackup;

namespace Audex.Infrastructure.Services.DatabaseBackup
{
    public class HttpDatabaseBackupProvider : IDatabaseBackupProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HttpDatabaseBackupProvider> _logger;

        public HttpDatabaseBackupProvider(
            HttpClient httpClient,
            ILogger<HttpDatabaseBackupProvider> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<byte[]> ExportDatabaseDumpAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Requesting database dump stream from InfrastructureManager at {BaseAddress}...", _httpClient.BaseAddress);

            using var response = await _httpClient.GetAsync("/api/backup", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("InfrastructureManager export failed with status {StatusCode}: {Error}", response.StatusCode, error);
                throw new InvalidOperationException($"InfrastructureManager backup export failed ({(int)response.StatusCode} {response.StatusCode}): {error}");
            }

            return await response.Content.ReadAsByteArrayAsync(cancellationToken);
        }

        public async Task ImportDatabaseDumpAsync(byte[] dumpData, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Sending database dump stream to InfrastructureManager for restore at {BaseAddress}...", _httpClient.BaseAddress);

            using var content = new ByteArrayContent(dumpData);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");

            using var response = await _httpClient.PostAsync("/api/restore", content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("InfrastructureManager restore failed with status {StatusCode}: {Error}", response.StatusCode, error);
                throw new InvalidOperationException($"InfrastructureManager backup restore failed ({(int)response.StatusCode} {response.StatusCode}): {error}");
            }
        }

        public async Task<DatabaseDumpValidationResultDto> ValidateDatabaseDumpAsync(byte[] dumpData, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Sending database dump stream to InfrastructureManager for validation at {BaseAddress}...", _httpClient.BaseAddress);

            using var content = new ByteArrayContent(dumpData);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");

            using var response = await _httpClient.PostAsync("/api/validate", content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("InfrastructureManager validate HTTP call failed with status {StatusCode}: {Error}", response.StatusCode, error);
                return new DatabaseDumpValidationResultDto
                {
                    IsValid = false,
                    ErrorMessage = $"InfrastructureManager validation failed ({(int)response.StatusCode}): {error}"
                };
            }

            var result = await response.Content.ReadFromJsonAsync<DatabaseDumpValidationResultDto>(cancellationToken: cancellationToken);
            return result ?? new DatabaseDumpValidationResultDto
            {
                IsValid = false,
                ErrorMessage = "Empty response received from InfrastructureManager validation."
            };
        }
    }
}
