#nullable enable
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.DatabaseBackup;
using Audex.Application.Interfaces.DatabaseBackup;

namespace Audex.WebApi.Controllers.DatabaseBackup
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class DatabaseBackupController : ControllerBase
    {
        private readonly IDatabaseBackupService _backupService;

        public DatabaseBackupController(IDatabaseBackupService backupService)
        {
            _backupService = backupService;
        }

        [HttpPost("Export")]
        public async Task<IActionResult> ExportBackup([FromBody] ExportBackupRequestDto? request)
        {
            var backup = await _backupService.CreateBackupAsync(request?.Password);
            Response.Headers.Append("X-File-Name", backup.FileName);
            Response.Headers.Append("Access-Control-Expose-Headers", "X-File-Name, Content-Disposition");
            return File(backup.Data, backup.ContentType, backup.FileName);
        }

        [HttpPost("Validate")]
        public async Task<ActionResult<BackupValidationResultDto>> ValidateBackup(
            [FromForm] IFormFile file,
            [FromForm] string? password = null)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new BackupValidationResultDto
                {
                    IsValid = false,
                    ErrorMessage = "No backup file uploaded."
                });
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            var result = await _backupService.ValidateBackupAsync(fileBytes, password);
            return Ok(result);
        }

        [HttpPost("Restore")]
        public async Task<ActionResult<RestoreBackupResultDto>> RestoreBackup(
            [FromForm] IFormFile file,
            [FromForm] string? password = null)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new RestoreBackupResultDto
                {
                    Success = false,
                    Message = "No backup file uploaded."
                });
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            var result = await _backupService.RestoreBackupAsync(fileBytes, password);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
