using System;
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

        [HttpGet("GetOil")]
        public async Task<ActionResult<OilWidgetDto>> GetOilAsync(
            [FromQuery] Guid dashboardId,
            [FromQuery] string widgetId)
        {
            var userId = GetUserId();
            var widgetData = await _dashboardWidgetsService.GetOilWidgetAsync(userId, dashboardId, widgetId);
            return Ok(widgetData);
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
