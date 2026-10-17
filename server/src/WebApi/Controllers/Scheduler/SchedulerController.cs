using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Shared.Common;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Scheduler;

namespace Audex.WebApi.Controllers.Scheduler
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SchedulerController : ControllerBase
    {
        private readonly ISchedulerTaskService _schedulerTaskService;
        private readonly ISchedulerJournalService _journalService;
        private readonly ISchedulerAttachmentService _attachmentService;
        private readonly IScheduleExecutor _scheduleExecutor;
        private readonly WebApiMapper _mapper;

        public SchedulerController(
            ISchedulerTaskService schedulerTaskService,
            ISchedulerJournalService journalService,
            ISchedulerAttachmentService attachmentService,
            IScheduleExecutor scheduleExecutor,
            WebApiMapper mapper)
        {
            _schedulerTaskService = schedulerTaskService;
            _journalService = journalService;
            _attachmentService = attachmentService;
            _scheduleExecutor = scheduleExecutor;
            _mapper = mapper;
        }

        [HttpGet("NotScheduledTasks")]
        public async Task<IEnumerable<ScheduledTaskDefinitionModel>> GetNotScheduledTasks()
        {
            var definitions = await _schedulerTaskService.GetNotScheduledTasksAsync();
            return _mapper.Map(definitions);
        }

        [HttpGet("Tasks")]
        public async Task<IEnumerable<ScheduledTaskModel>> GetTasks()
        {
            var tasks = await _schedulerTaskService.GetAllTasksAsync();
            return _mapper.Map(tasks);
        }

        [HttpGet("Tasks/{taskName}")]
        public async Task<ActionResult<ScheduledTaskModel>> GetTask(string taskName)
        {
            var task = await _schedulerTaskService.GetTaskByNameAsync(taskName);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map(task));
        }

        [HttpPost("Tasks")]
        public async Task<ActionResult<OperationResultDto<ScheduledTaskModel>>> CreateTask([FromBody] CreateScheduledTaskModel model)
        {
            try
            {
                var dto = _mapper.Map(model);
                var created = await _schedulerTaskService.CreateTaskAsync(dto);
                return Ok(OperationResultDto<ScheduledTaskModel>.Success(_mapper.Map(created)));
            }
            catch (ArgumentException ex)
            {
                return Ok(OperationResultDto<ScheduledTaskModel>.Failure(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return Ok(OperationResultDto<ScheduledTaskModel>.Failure(ex.Message));
            }
        }

        [HttpDelete("Tasks/{taskName}")]
        public async Task<IActionResult> DeleteTask(string taskName)
        {
            var result = await _schedulerTaskService.DeleteTaskAsync(taskName);
            if (!result)
            {
                return NotFound();
            }
            return Ok();
        }

        [HttpPut("Tasks/{taskName}/Schedule")]
        public async Task<IActionResult> UpdateSchedule(string taskName, [FromBody] UpdateScheduleModel model)
        {
            try
            {
                var dto = _mapper.Map(model);
                var updated = await _schedulerTaskService.UpdateScheduleAsync(taskName, dto);
                if (!updated)
                {
                    return NotFound();
                }
                return Ok();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ProblemDetails { Detail = ex.Message });
            }
        }

        [HttpPut("Tasks/{taskName}/Toggle")]
        public async Task<IActionResult> ToggleTask(string taskName, [FromQuery] bool isEnabled)
        {
            var updated = await _schedulerTaskService.ToggleTaskStatusAsync(taskName, isEnabled);
            if (!updated)
            {
                return NotFound();
            }
            return Ok();
        }

        [HttpPost("Tasks/{taskName}/RunNow")]
        public async Task<IActionResult> RunNow(string taskName)
        {
            try
            {
                await _scheduleExecutor.ExecuteJobAsync(taskName, triggerSource: ScheduledTaskTriggerSource.Manual);
                return Ok();
            }
            catch (ArgumentException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Task is not registered",
                    detail: ex.Message);
            }
        }

        [HttpPost("Journal")]
        public async Task<PagedResult<ScheduledTaskJournalModel>> GetJournal([FromBody] GetJournalQuery query)
        {
            var filter = _mapper.Map(query);
            var records = await _journalService.GetJournalAsync(filter);
            return _mapper.Map(records);
        }

        [HttpGet("Journal/Attachments/{attachmentId}/Download")]
        public async Task<IActionResult> DownloadAttachment(Guid attachmentId)
        {
            var fileStream = await _attachmentService.GetAttachmentFileStreamAsync(attachmentId);
            if (fileStream == null || fileStream.Stream == null)
            {
                return NotFound();
            }

            return File(fileStream.Stream, fileStream.ContentType ?? "application/octet-stream");
        }
    }
}
