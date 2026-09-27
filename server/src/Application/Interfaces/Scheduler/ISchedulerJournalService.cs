using Audex.Application.DTO.Scheduler;
using Audex.Shared.Common;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Scheduler
{
    public interface ISchedulerJournalService
    {
        Task<PagedResult<ScheduledTaskJournalDto>> GetJournalAsync(SchedulerJournalFilterDto filter);
    }
}
