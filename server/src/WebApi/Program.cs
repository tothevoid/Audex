using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Audex.Application.Extensions;
using Audex.Infrastructure.Database;
using Audex.Infrastructure.Extensions;
using Audex.Infrastructure.Messages;
using Audex.WebApi.Extensions;
using Audex.WebApi.Middlewares;
using TickerQ.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.AddAudexLogging();

builder.Services.AddExternalHttpClients();
builder.Services.AddClientCors(builder.Configuration);

builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
    options.ShutdownTimeout = TimeSpan.FromSeconds(10);
});

builder.Services.AddDatabaseConnection(builder.Configuration);
builder.Services.AddTickerQConfiguration();

builder.Services.AddMinioConfiguration(builder.Configuration);
builder.Services.AddInfrastructureManagerClient(builder.Configuration);

builder.Services.AddSignalR();
builder.Services.AddControllers();

builder.Services.AddInfrastructureServices();
builder.Services.AddApplicationServices();
builder.Services.AddJwtAuth(builder.Configuration);

builder.Services.AddMappings();

var app = builder.Build();

app.UseMiddleware<RequestIdMiddleware>();

app.MigrateDatabase();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.MapHub<ServerMessagesHub>("/messages");

app.Map("/Error", (HttpContext context) =>
{
    return Results.Problem("Something went wrong");
});

app.UseRouting();

app.UseCors("AllowReactApp");

app.UseMiddleware<DatabaseMaintenanceMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.UseAudexRequestLogging();

app.MapControllers();
app.UseTickerQ();

try
{
    Log.Information("Starting Audex Web API application");
    app.Run();
}
catch (Exception exception)
{
    Log.Fatal(exception, "Audex Web API terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}