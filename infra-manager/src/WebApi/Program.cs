using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using InfrastructureManager.Application.Extensions;
using InfrastructureManager.WebApi.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// Register Controllers
builder.Services.AddControllers();

// Register Application layer services
builder.Services.AddInfrastructureManagerApplication(builder.Configuration);

var app = builder.Build();

// Register Api Key Auth
app.UseMiddleware<ApiKeyAuthMiddleware>();

// Map Controller Endpoints
app.MapControllers();

app.Run();
