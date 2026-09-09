using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Scheduler;

namespace Audex.Application.Interfaces.Scheduler
{
    public interface ISchedulerTaskService
    {
        Task<IEnumerable<ScheduledTaskDefinitionDto>> GetNotScheduledTasksAsync();

        Task<IEnumerable<ScheduledTaskDto>> GetAllTasksAsync();

        Task<ScheduledTaskDto> GetTaskByNameAsync(string taskName);

        Task<ScheduledTaskDto> CreateTaskAsync(CreateScheduledTaskDto dto);

        Task<bool> UpdateScheduleAsync(string taskName, UpdateScheduleDto dto);

        Task<bool> ToggleTaskStatusAsync(string taskName, bool isEnabled);

        Task<bool> DeleteTaskAsync(string taskName);
    }
}
