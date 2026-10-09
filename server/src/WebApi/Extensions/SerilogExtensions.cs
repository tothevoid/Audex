using System;
using System.IO;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;
using Audex.WebApi.Constants;
using Audex.WebApi.Middlewares;

namespace Audex.WebApi.Extensions
{
    public static class SerilogExtensions
    {
        public static WebApplicationBuilder AddAudexLogging(this WebApplicationBuilder builder)
        {
            builder.Host.UseSerilog((hostingContext, serviceProvider, loggerConfiguration) =>
            {
                var assemblyName = typeof(Program).Assembly.GetName().Name;
                if (string.IsNullOrWhiteSpace(assemblyName))
                {
                    throw new InvalidOperationException("Failed to determine root application namespace from the entry assembly.");
                }

                var rootNamespace = assemblyName.Split('.')[0];

                loggerConfiguration
                    .MinimumLevel.Warning()
                    .MinimumLevel.Override(rootNamespace, LogEventLevel.Information)
                    .MinimumLevel.Override(nameof(Serilog), LogEventLevel.Information)
                    .Enrich.FromLogContext()
                    .Enrich.WithEnvironmentName()
                    .Enrich.WithMachineName()
                    .Enrich.WithThreadId();

                var logsDirectory = Path.Combine(AppContext.BaseDirectory, LogPropertyConstants.LogsDirectoryName);
                var logFilePath = Path.Combine(logsDirectory, LogPropertyConstants.LogFilePattern);

                if (hostingContext.HostingEnvironment.IsDevelopment())
                {
                    loggerConfiguration.WriteTo.Async(asyncSink => asyncSink.Console(
                        outputTemplate: LogPropertyConstants.ConsoleOutputTemplate));
                }
                else
                {
                    loggerConfiguration.WriteTo.Async(asyncSink => asyncSink.Console(new CompactJsonFormatter()));
                }

                loggerConfiguration.WriteTo.Async(asyncSink => asyncSink.File(
                    formatter: new CompactJsonFormatter(),
                    path: logFilePath,
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 14,
                    fileSizeLimitBytes: 20 * 1024 * 1024,
                    rollOnFileSizeLimit: true));
            });

            return builder;
        }

        public static IApplicationBuilder UseAudexRequestLogging(this IApplicationBuilder application)
        {
            return application.UseSerilogRequestLogging(options =>
            {
                options.MessageTemplate = LogPropertyConstants.RequestLoggingMessageTemplate;
                options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
                {
                    var requestId = httpContext.Items.TryGetValue(LogPropertyConstants.RequestId, out var itemValue)
                        ? itemValue?.ToString()
                        : httpContext.TraceIdentifier;

                    diagnosticContext.Set(LogPropertyConstants.RequestId, requestId ?? string.Empty);
                    diagnosticContext.Set(LogPropertyConstants.ClientIp, httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty);
                    diagnosticContext.Set(LogPropertyConstants.UserAgent, httpContext.Request.Headers.UserAgent.ToString());

                    if (httpContext.Request.QueryString.HasValue)
                    {
                        diagnosticContext.Set(LogPropertyConstants.QueryString, httpContext.Request.QueryString.Value);
                    }

                    if (httpContext.User.Identity?.IsAuthenticated == true)
                    {
                        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (!string.IsNullOrWhiteSpace(userIdClaim))
                        {
                            diagnosticContext.Set(LogPropertyConstants.UserId, userIdClaim);
                        }
                    }
                };
            });
        }
    }
}
