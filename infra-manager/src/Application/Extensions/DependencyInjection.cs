using System;
using System.Net.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using InfrastructureManager.Application.Interfaces;
using InfrastructureManager.Application.Services;
using Minio;

namespace InfrastructureManager.Application.Extensions
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureManagerApplication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddTransient<IPostgresBackupService, PostgresBackupService>();
            services.AddTransient<IS3BackupService, S3BackupService>();
            services.AddTransient<IInfrastructureBackupService, InfrastructureBackupService>();

            var fileStorageSection = configuration.GetSection("FileStorage");
            if (fileStorageSection.Exists())
            {
                var endpoint = fileStorageSection["Endpoint"] ?? "127.0.0.1";
                var user = fileStorageSection["User"] ?? "";
                var password = fileStorageSection["Password"] ?? "";
                var useSsl = bool.TryParse(fileStorageSection["UseSsl"], out var ssl) && ssl;

                var minioSocketsHandler = new SocketsHttpHandler
                {
                    PooledConnectionLifetime = TimeSpan.FromMinutes(15),
                    KeepAlivePingDelay = TimeSpan.FromSeconds(30),
                    KeepAlivePingTimeout = TimeSpan.FromSeconds(5),
                    EnableMultipleHttp2Connections = true,
                    SslOptions = new System.Net.Security.SslClientAuthenticationOptions
                    {
                        RemoteCertificateValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
                    }
                };

                services.AddMinio(configureClient =>
                {
                    var client = configureClient
                        .WithSSL(useSsl)
                        .WithCredentials(user, password)
                        .WithHttpClient(new HttpClient(minioSocketsHandler));

                    if (int.TryParse(fileStorageSection["Port"], out var port) && port > 0 && !endpoint.Contains(':'))
                    {
                        client.WithEndpoint(endpoint, port);
                    }
                    else
                    {
                        client.WithEndpoint(endpoint);
                    }

                    client.Build();
                });
            }

            return services;
        }
    }
}
