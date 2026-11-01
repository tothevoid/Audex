using System.Threading;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Scheduler
{
    public interface ISchedulerCatchUpService
    {
        Task ProcessMissedTasksAsync(CancellationToken cancellationToken = default);
    }
}

