using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.User;
using Audex.Infrastructure.Constants;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Audex.WebApi.Controllers.User
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class UserDashboardController : ControllerBase
    {
        private readonly IUserDashboardService _userDashboardService;
        private readonly ILocalizationService _localizer;
        private readonly WebApiMapper _mapper;

        public UserDashboardController(
            IUserDashboardService userDashboardService,
            ILocalizationService localizer,
            WebApiMapper mapper)
        {
            _userDashboardService = userDashboardService;
            _localizer = localizer;
            _mapper = mapper;
        }

        [HttpGet("GetAll")]
        public async Task<IEnumerable<UserDashboardModel>> GetAll()
        {
            var userId = GetUserId();
            var dashboards = await _userDashboardService.GetAllByUserIdAsync(userId);
            return _mapper.Map(dashboards);
        }

        [HttpGet("GetById")]
        public async Task<ActionResult<UserDashboardModel>> GetById([FromQuery] Guid id)
        {
            var userId = GetUserId();
            var dashboard = await _userDashboardService.GetByIdAsync(id, userId);
            if (dashboard == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map(dashboard));
        }

        [HttpGet("GetDefault")]
        public async Task<ActionResult<UserDashboardModel>> GetDefault()
        {
            var userId = GetUserId();
            var dashboard = await _userDashboardService.GetOrCreateDefaultDashboardAsync(userId);
            return Ok(_mapper.Map(dashboard));
        }

        [HttpPost("Create")]
        public async Task<ActionResult<UserDashboardModel>> Create([FromBody] CreateUserDashboardModel model)
        {
            var userId = GetUserId();
            try
            {
                var createdDashboard = await _userDashboardService.CreateAsync(userId, model.Title, model.LayoutJson);
                return Ok(_mapper.Map(createdDashboard));
            }
            catch (ArgumentException argumentException)
            {
                var title = await _localizer.GetForUserAsync(LocalizationKeys.Dashboard.InvalidLayoutTitle, userId);
                return BadRequest(new ProblemDetails
                {
                    Title = title,
                    Detail = argumentException.Message,
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        [HttpPut("UpdateLayout")]
        public async Task<ActionResult<UserDashboardModel>> UpdateLayout([FromBody] UpdateUserDashboardLayoutModel model)
        {
            var userId = GetUserId();
            try
            {
                var updatedDashboard = await _userDashboardService.UpdateLayoutAsync(model.Id, userId, model.LayoutJson);
                if (updatedDashboard == null)
                {
                    return NotFound();
                }

                return Ok(_mapper.Map(updatedDashboard));
            }
            catch (ArgumentException argumentException)
            {
                var title = await _localizer.GetForUserAsync(LocalizationKeys.Dashboard.InvalidLayoutTitle, userId);
                return BadRequest(new ProblemDetails
                {
                    Title = title,
                    Detail = argumentException.Message,
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        [HttpPut("Rename")]
        public async Task<ActionResult<UserDashboardModel>> Rename([FromBody] RenameUserDashboardModel model)
        {
            var userId = GetUserId();
            var renamedDashboard = await _userDashboardService.RenameAsync(model.Id, userId, model.Title);
            if (renamedDashboard == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map(renamedDashboard));
        }

        [HttpPost("SetDefault")]
        public async Task<ActionResult> SetDefault([FromQuery] Guid id)
        {
            var userId = GetUserId();
            var result = await _userDashboardService.SetDefaultAsync(id, userId);
            if (!result)
            {
                return NotFound();
            }

            return Ok();
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> Delete([FromQuery] Guid id)
        {
            var userId = GetUserId();
            var result = await _userDashboardService.DeleteAsync(id, userId);
            if (!result)
            {
                return NotFound();
            }

            return Ok();
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
