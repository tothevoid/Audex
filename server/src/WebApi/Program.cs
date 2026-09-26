using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Audex.Infrastructure.Database;
using Audex.Infrastructure.Messages;
using TickerQ.DependencyInjection;
using Microsoft.AspNetCore.Http;
using Audex.Application.Extensions;
using Audex.Infrastructure.Extensions;
using Audex.WebApi.Extensions;

var builder = WebApplication.CreateBuilder(args);

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

app.UseMiddleware<Audex.WebApi.Middlewares.DatabaseMaintenanceMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.UseTickerQ();

app.Run();