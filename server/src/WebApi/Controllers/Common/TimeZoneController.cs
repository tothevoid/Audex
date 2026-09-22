using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Common;
using Audex.Application.Interfaces.Common;

namespace Audex.WebApi.Controllers.Common
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class TimeZoneController : ControllerBase
    {
        private readonly ITimeZoneService _timeZoneService;

        public TimeZoneController(ITimeZoneService timeZoneService)
        {
            _timeZoneService = timeZoneService;
        }

        [HttpGet]
        public ActionResult<IReadOnlyList<TimeZoneDto>> GetTimeZones()
        {
            var timeZones = _timeZoneService.GetTimeZones();
            return Ok(timeZones);
        }
    }
}
