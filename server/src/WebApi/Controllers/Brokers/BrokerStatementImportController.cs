using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.Constants;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.DTO.Common;
using Audex.Application.Interfaces.Brokers.Statements;
using Audex.Application.Interfaces.Localization;

namespace Audex.WebApi.Controllers.Brokers
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class BrokerStatementImportController : ControllerBase
    {
        private readonly IBrokerStatementImportService _importService;
        private readonly ILocalizationService _localizer;

        public BrokerStatementImportController(
            IBrokerStatementImportService importService,
            ILocalizationService localizer)
        {
            _importService = importService;
            _localizer = localizer;
        }

        [HttpGet("importers")]
        public ActionResult<IReadOnlyList<BrokerStatementImporterDto>> GetImporters()
        {
            var importers = _importService.GetImporters();
            return Ok(importers);
        }

        [HttpPost("analyze")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<BrokerStatementAnalysisResultDto>> AnalyzeAsync(
            [FromForm] AnalyzeBrokerStatementRequestDto request)
        {
            if (request?.File == null || request.File.Length == 0 ||
                request.BrokerAccountId == Guid.Empty ||
                string.IsNullOrWhiteSpace(request.ImporterId) ||
                string.IsNullOrWhiteSpace(request.TimeZoneId))
            {
                return BadRequest(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Bad Request",
                    Detail = await _localizer.GetForUserAsync(LocalizationKeys.Errors.ValidationError)
                });
            }

            await using var stream = request.File.OpenReadStream();
            var result = await _importService.AnalyzeAsync(
                stream,
                request.BrokerAccountId,
                request.ImporterId,
                request.TimeZoneId);

            return Ok(result);
        }

        [HttpPost("apply")]
        public async Task<ActionResult<OperationResultDto<ApplyStatementDiffsSummaryDto>>> ApplyDiffsAsync(
            [FromBody] ApplyStatementDiffsRequestDto request)
        {
            var result = await _importService.ApplyDiffsAsync(request);
            return Ok(result);
        }
    }
}
