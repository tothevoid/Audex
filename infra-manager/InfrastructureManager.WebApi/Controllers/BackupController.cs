using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using InfrastructureManager.Application.DTO;
using InfrastructureManager.Application.Interfaces;

namespace InfrastructureManager.WebApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class BackupController : ControllerBase
    {
        private readonly IInfrastructureBackupService _infrastructureBackupService;

        public BackupController(IInfrastructureBackupService infrastructureBackupService)
        {
            _infrastructureBackupService = infrastructureBackupService;
        }

        [HttpGet("backup")]
        public IResult ExportBackup(CancellationToken cancellationToken)
        {
            return Results.Stream(
                async destinationStream =>
                {
                    var pipe = new System.IO.Pipelines.Pipe();

                    var produceTask = Task.Run(async () =>
                    {
                        System.Exception? error = null;
                        try
                        {
                            await using var writeStream = pipe.Writer.AsStream();
                            await _infrastructureBackupService.WriteFullBackupToStreamAsync(writeStream, cancellationToken);
                        }
                        catch (System.Exception ex)
                        {
                            error = ex;
                        }
                        finally
                        {
                            await pipe.Writer.CompleteAsync(error);
                        }
                    }, cancellationToken);

                    try
                    {
                        await using var readStream = pipe.Reader.AsStream();
                        await readStream.CopyToAsync(destinationStream, cancellationToken);
                    }
                    finally
                    {
                        await pipe.Reader.CompleteAsync();
                    }

                    await produceTask;
                },
                contentType: "application/zip",
                fileDownloadName: "backup.zip");
        }

        [HttpPost("restore")]
        public async Task<IResult> RestoreBackup(CancellationToken cancellationToken)
        {
            await _infrastructureBackupService.RestoreFullBackupFromStreamAsync(Request.Body, cancellationToken);
            return Results.Ok(new RestoreResultDto
            {
                Success = true,
                Message = "Infrastructure restore (Database + S3) completed successfully."
            });
        }
    }
}
