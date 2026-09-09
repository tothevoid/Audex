using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Common;
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

        [HttpGet("not-scheduled-tasks")]
        public async Task<IEnumerable<ScheduledTaskDefinitionModel>> GetNotScheduledTasks()
        {
            var definitions = await _schedulerTaskService.GetNotScheduledTasksAsync();
            return _mapper.Map(definitions);
        }

        [HttpGet("tasks")]
        public async Task<IEnumerable<ScheduledTaskModel>> GetTasks()
        {
            var tasks = await _schedulerTaskService.GetAllTasksAsync();
            return _mapper.Map(tasks);
        }

        [HttpGet("tasks/{taskName}")]
        public async Task<ActionResult<ScheduledTaskModel>> GetTask(string taskName)
        {
            var task = await _schedulerTaskService.GetTaskByNameAsync(taskName);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(_mapper.Map(task));
        }

        [HttpPost("tasks")]
        public async Task<ActionResult<ScheduledTaskModel>> CreateTask([FromBody] CreateScheduledTaskModel model)
        {
            try
            {
                var dto = _mapper.Map(model);
                var created = await _schedulerTaskService.CreateTaskAsync(dto);
                return Ok(_mapper.Map(created));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ProblemDetails { Detail = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new ProblemDetails { Detail = ex.Message });
            }
        }

        [HttpDelete("tasks/{taskName}")]
        public async Task<IActionResult> DeleteTask(string taskName)
        {
            var result = await _schedulerTaskService.DeleteTaskAsync(taskName);
            if (!result)
            {
                return NotFound();
            }
            return Ok();
        }

        [HttpPut("tasks/{taskName}/schedule")]
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

        [HttpPut("tasks/{taskName}/toggle")]
        public async Task<IActionResult> ToggleTask(string taskName, [FromQuery] bool isEnabled)
        {
            var updated = await _schedulerTaskService.ToggleTaskStatusAsync(taskName, isEnabled);
            if (!updated)
            {
                return NotFound();
            }
            return Ok();
        }

        [HttpPost("tasks/{taskName}/run-now")]
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

        [HttpPost("journal")]
        public async Task<IEnumerable<ScheduledTaskJournalModel>> GetJournal([FromBody] GetJournalQuery query)
        {
            var records = await _journalService.GetJournalAsync(
                query.PageIndex,
                query.RecordsQuantity,
                query.TaskName,
                query.Status,
                query.TriggerSource);
            return _mapper.Map(records);
        }

        [HttpGet("journal/pagination")]
        public async Task<PaginationConfigModel> GetJournalPagination(
            [FromQuery] string taskName = null,
            [FromQuery] ScheduledTaskExecutionStatus? status = null,
            [FromQuery] ScheduledTaskTriggerSource? triggerSource = null)
        {
            var pagination = await _journalService.GetJournalPaginationAsync(taskName, status, triggerSource);
            return _mapper.Map(pagination);
        }

        [HttpGet("journal/attachments/{attachmentId}/download")]
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
