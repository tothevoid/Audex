using System.IO;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using InfrastructureManager.Application.Interfaces;
using InfrastructureManager.WebApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Xunit;

namespace InfrastructureManager.Application.Tests.Controllers
{
    public class BackupControllerTests
    {
        private readonly IInfrastructureBackupService _infrastructureBackupService;
        private readonly BackupController _controller;

        public BackupControllerTests()
        {
            _infrastructureBackupService = Substitute.For<IInfrastructureBackupService>();
            _controller = new BackupController(_infrastructureBackupService);

            var httpContext = new DefaultHttpContext();
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }

        [Fact]
        public async Task ExportBackup_Should_Return_Stream_Result_And_Call_WriteFullBackupToStreamAsync()
        {
            // Arrange
            var httpContext = new DefaultHttpContext();
            var serviceProvider = Substitute.For<System.IServiceProvider>();
            serviceProvider.GetService(typeof(Microsoft.Extensions.Logging.ILoggerFactory))
                .Returns(Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
            httpContext.RequestServices = serviceProvider;

            var responseBody = new MemoryStream();
            httpContext.Response.Body = responseBody;

            // Act
            var result = _controller.ExportBackup(CancellationToken.None);
            await result.ExecuteAsync(httpContext);

            // Assert
            httpContext.Response.ContentType.Should().Be("application/zip");
            await _infrastructureBackupService.Received(1).WriteFullBackupToStreamAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task RestoreBackup_Should_Call_RestoreFullBackupFromStreamAsync_And_Return_Ok()
        {
            // Arrange
            var requestBody = new MemoryStream(new byte[] { 1, 2, 3 });
            _controller.HttpContext.Request.Body = requestBody;

            // Act
            var result = await _controller.RestoreBackup(CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            await _infrastructureBackupService.Received(1).RestoreFullBackupFromStreamAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>());
        }
    }
}
