using System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Minio;
using Audex.Application.Extensions;
using Audex.Infrastructure.Database;
using Audex.Infrastructure.Interfaces.DatabaseBackup;
using Audex.Infrastructure.Services.DatabaseBackup;
using Audex.WebApi.Mappings;
using System.Net.Http;
using System.Text;

namespace Audex.WebApi.Extensions
{
    public static class DependenciesInjection
    {
        public static IServiceCollection AddMinioConfiguration(this IServiceCollection services, IConfiguration configuration)
        {
            var fileStorageSection = configuration.GetSection("FileStorage");

            var endpoint = fileStorageSection.GetSection("Endpoint").Value;
            var useSsl = bool.Parse(fileStorageSection.GetSection("UseSsl").Value);

            var user = fileStorageSection.GetSection("User").Value;
            var password = fileStorageSection.GetSection("Password").Value;

            var minioSocketsHandler = new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(15),
                KeepAlivePingDelay = TimeSpan.FromSeconds(30),
                KeepAlivePingTimeout = TimeSpan.FromSeconds(5),
                EnableMultipleHttp2Connections = true,
                SslOptions = new System.Net.Security.SslClientAuthenticationOptions
                {
                    // TODO: fix self signed cert workaround
                    RemoteCertificateValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
                }
            };

            services.AddMinio(configureClient => configureClient
                .WithEndpoint(endpoint)
                .WithSSL(useSsl)
                .WithCredentials(user, password)
                .WithHttpClient(new HttpClient(minioSocketsHandler))
                .Build());

            return services;
        }

        public static IServiceCollection AddExternalHttpClients(this IServiceCollection services)
        {
            services.AddHttpClient("", client => { })
                .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
                {
                    PooledConnectionLifetime = TimeSpan.FromMinutes(15),
                    KeepAlivePingDelay = TimeSpan.FromSeconds(30),
                    KeepAlivePingTimeout = TimeSpan.FromSeconds(5),
                    EnableMultipleHttp2Connections = true
                });

            return services;
        }

        public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration configuration)
        {
            var authSection = configuration.GetSection("Auth");

            var issuer = authSection.GetSection("Issuer").Value;
            var audience = authSection.GetSection("Audience").Value;
            var secret = authSection.GetSection("Secret").Value;

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = issuer,
                        ValidAudience = audience,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
                    };
                });

            return services;
        }

        public static IServiceCollection AddClientCors(this IServiceCollection services, IConfiguration configuration)
        {
            var clientUrl = configuration.GetSection("Client").GetSection("Url").Value;
            services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp",
                    policy =>
                    {
                        policy.WithOrigins(clientUrl)
                            .AllowAnyMethod()
                            .AllowCredentials()
                            .AllowAnyHeader();
                    });
            });

            return services;
        }

        public static IServiceCollection AddDatabaseConnection(this IServiceCollection services, IConfiguration configuration)
        {
            var dbConnection = configuration.GetSection("DB").GetSection("ConnectionString").Value;
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(dbConnection, npgsqlOptions =>
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorCodesToAdd: null);
                    npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery);
                }));

            return services;
        }

        public static IServiceCollection AddMappings(this IServiceCollection services)
        {
            services.AddSingleton<WebApiMapper>();
            return services;
        }

        public static IServiceCollection AddInfrastructureManagerClient(this IServiceCollection services, IConfiguration configuration)
        {
            var infraSection = configuration.GetSection("InfrastructureManager");
            var url = infraSection.GetSection("Url").Value;
            var apiKey = infraSection.GetSection("ApiKey").Value;

            if (string.IsNullOrWhiteSpace(url))
            {
                throw new InvalidOperationException("InfrastructureManager:Url configuration is required and was not provided.");
            }

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("InfrastructureManager:ApiKey configuration is required and was not provided.");
            }

            services.AddHttpClient<IDatabaseBackupProvider, HttpDatabaseBackupProvider>(client =>
            {
                client.BaseAddress = new Uri(url);
                client.DefaultRequestHeaders.Add("X-Service-Api-Key", apiKey);
                client.Timeout = TimeSpan.FromMinutes(10);
            });

            return services;
        }
    }
}
