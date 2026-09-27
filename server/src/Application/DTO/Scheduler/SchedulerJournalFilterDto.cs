using Audex.Application.Enums.Scheduler;
using Audex.Shared.Common;

namespace Audex.Application.DTO.Scheduler
{
    public class SchedulerJournalFilterDto : BasePageable
    {
        public string TaskName { get; set; }

        public ScheduledTaskExecutionStatus? Status { get; set; }

        public ScheduledTaskTriggerSource? TriggerSource { get; set; }
    }
}
