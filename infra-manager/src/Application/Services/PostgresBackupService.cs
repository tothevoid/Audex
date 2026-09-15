#nullable enable
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using InfrastructureManager.Application.Interfaces;
using Npgsql;

namespace InfrastructureManager.Application.Services
{
    public class PostgresBackupService : IPostgresBackupService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<PostgresBackupService> _logger;

        public PostgresBackupService(
            IConfiguration configuration,
            ILogger<PostgresBackupService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        private NpgsqlConnectionStringBuilder GetConnectionStringBuilder()
        {
            var connStr = _configuration.GetSection("DB").GetSection("ConnectionString").Value 
                ?? _configuration["DB__ConnectionString"]
                ?? _configuration["DB:ConnectionString"];

            if (string.IsNullOrEmpty(connStr))
            {
                throw new InvalidOperationException("Database connection string is not configured in DB:ConnectionString.");
            }

            return new NpgsqlConnectionStringBuilder(connStr);
        }

        public async Task WriteDumpToStreamAsync(Stream destinationStream, CancellationToken cancellationToken = default)
        {
            var npgsql = GetConnectionStringBuilder();
            _logger.LogInformation("Streaming pg_dump for database {Database} on host {Host}:{Port}...", npgsql.Database, npgsql.Host, npgsql.Port);

            var startInfo = new ProcessStartInfo
            {
                FileName = "pg_dump",
                Arguments = $"-h {npgsql.Host} -p {npgsql.Port} -U {npgsql.Username} -d {npgsql.Database} -w --clean --if-exists --no-owner --no-privileges --inserts --encoding=UTF8",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            if (!string.IsNullOrEmpty(npgsql.Password))
            {
                startInfo.EnvironmentVariables["PGPASSWORD"] = npgsql.Password;
            }

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            var copyTask = process.StandardOutput.BaseStream.CopyToAsync(destinationStream, cancellationToken);

            await Task.WhenAll(copyTask, errorTask);
            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                var error = await errorTask;
                throw new InvalidOperationException($"pg_dump failed with exit code {process.ExitCode}: {error}");
            }
        }

        public async Task RestoreDumpFromStreamAsync(Stream sourceStream, CancellationToken cancellationToken = default)
        {
            var npgsql = GetConnectionStringBuilder();

            NpgsqlConnection.ClearAllPools();
            await TerminateOtherConnectionsAsync(npgsql, cancellationToken);

            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "psql",
                    Arguments = $"-h {npgsql.Host} -p {npgsql.Port} -U {npgsql.Username} -d {npgsql.Database} -w -v ON_ERROR_STOP=1 -q -X --no-psqlrc",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                if (!string.IsNullOrEmpty(npgsql.Password))
                {
                    startInfo.EnvironmentVariables["PGPASSWORD"] = npgsql.Password;
                }

                using var process = new Process { StartInfo = startInfo };
                process.Start();

                var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
                var writeTask = Task.Run(async () =>
                {
                    await sourceStream.CopyToAsync(process.StandardInput.BaseStream, cancellationToken);
                    await process.StandardInput.BaseStream.FlushAsync(cancellationToken);
                    process.StandardInput.Close();
                }, cancellationToken);

                await Task.WhenAll(writeTask, errorTask);
                await process.WaitForExitAsync(cancellationToken);

                if (process.ExitCode != 0)
                {
                    var error = await errorTask;
                    throw new InvalidOperationException($"psql restore failed with exit code {process.ExitCode}: {error}");
                }
            }
            finally
            {
                NpgsqlConnection.ClearAllPools();
            }
        }

        private async Task TerminateOtherConnectionsAsync(NpgsqlConnectionStringBuilder npgsql, CancellationToken cancellationToken)
        {
            try
            {
                await using var connection = new NpgsqlConnection(npgsql.ConnectionString);
                await connection.OpenAsync(cancellationToken);

                var sql = @"
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = @dbname
                      AND pid <> pg_backend_pid();";

                await using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("dbname", npgsql.Database ?? string.Empty);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to terminate other database connections prior to restore.");
            }
        }
    }
}
