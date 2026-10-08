#nullable enable
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.Interfaces.Dashboard;
using Audex.Infrastructure.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Audex.WebApi.Controllers.Dashboard
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardWidgetsController : ControllerBase
    {
        private readonly IDashboardWidgetsService _dashboardWidgetsService;

        public DashboardWidgetsController(IDashboardWidgetsService dashboardWidgetsService)
        {
            _dashboardWidgetsService = dashboardWidgetsService;
        }

        [HttpPost("GetOil")]
        public async Task<ActionResult<OilWidgetDto>> GetOilAsync([FromBody] OilWidgetRequestDto request)
        {
            var userId = GetUserId();
            var widgetData = await _dashboardWidgetsService.GetOilWidgetAsync(userId, request);
            return Ok(widgetData);
        }

        [HttpGet("GetOilSymbols")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetOilSymbolsAsync()
        {
            var symbols = await _dashboardWidgetsService.GetSupportedOilSymbolsAsync();
            return Ok(symbols);
        }

        [HttpPost("GetIndices")]
        public async Task<ActionResult<IndicesWidgetDto>> GetIndicesAsync([FromBody] IndicesWidgetRequestDto request)
        {
            var userId = GetUserId();
            var widgetData = await _dashboardWidgetsService.GetIndicesWidgetAsync(userId, request);
            return Ok(widgetData);
        }

        [HttpGet("GetSupportedIndices")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetSupportedIndicesAsync()
        {
            var indices = await _dashboardWidgetsService.GetSupportedIndicesAsync();
            return Ok(indices);
        }

        [HttpGet("GetTotalBalanceWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetTotalBalanceWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetTotalBalanceWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetCashDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetCashDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetCashDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetBankAccountsDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetBankAccountsDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetBankAccountsDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetSecuritiesDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetSecuritiesDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetSecuritiesDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetDepositsDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetDepositsDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetDepositsDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetDepositIncomesDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetDepositIncomesDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetDepositIncomesDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetDebtsDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetDebtsDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetDebtsDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetCryptoDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetCryptoDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetCryptoDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetBanksDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetBanksDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetBanksDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetSpentsDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetSpentsDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetSpentsDistributionWidgetDataAsync();
            return Ok(data);
        }

        [HttpGet("GetIncomesDistributionWidgetData")]
        public async Task<ActionResult<DistributionWidgetDataDto>> GetIncomesDistributionWidgetDataAsync()
        {
            var data = await _dashboardWidgetsService.GetIncomesDistributionWidgetDataAsync();
            return Ok(data);
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return UserProfileConstants.UserProfileId;
        }
    }
}
