using System;
using System.Reflection;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Interfaces.Messages;
using Audex.Shared.Constants;

namespace Audex.Application.Jobs
{
    public abstract class ScheduledJobBase : IScheduledJob
    {
        protected readonly IDatabaseStateService _databaseStateService;
        protected readonly ISchedulerAttachmentService _attachmentService;
        protected readonly IServerNotifier _serverNotifier;

        protected virtual string TaskName =>
            GetType().GetCustomAttribute<ScheduledJobAttribute>()?.TaskName ?? GetType().Name;

        protected ScheduledJobBase(
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
        {
            _databaseStateService = databaseStateService;
            _attachmentService = attachmentService;
            _serverNotifier = serverNotifier;
        }

        public async Task ExecuteAsync(
            ScheduledTaskTriggerSource triggerSource = ScheduledTaskTriggerSource.Manual,
            CancellationToken cancellationToken = default,
            Guid? occurrenceId = null)
        {
            if (_databaseStateService.IsRestoring)
            {
                return;
            }

            await _serverNotifier.SendToAllAsync(ServerNotificationEvents.ScheduledTaskStarted, TaskName);
           
            try
            {
                var result = await ExecuteCoreAsync(triggerSource, cancellationToken);

                if (result?.Attachment != null && occurrenceId.HasValue && occurrenceId.Value != Guid.Empty)
                {
                    await _attachmentService.SaveAttachmentAsync(occurrenceId.Value, result.Attachment);
                }

                await OnSuccessAsync(triggerSource, result, cancellationToken);
            }
            catch (Exception ex)
            {
                await OnFailureAsync(triggerSource, ex, cancellationToken);
                throw;
            }
        }

        protected abstract Task<JobExecutionResult> ExecuteCoreAsync(
            ScheduledTaskTriggerSource triggerSource,
            CancellationToken cancellationToken);

        protected virtual Task OnSuccessAsync(
            ScheduledTaskTriggerSource triggerSource,
            JobExecutionResult result,
            CancellationToken cancellationToken) => Task.CompletedTask;

        protected virtual Task OnFailureAsync(
            ScheduledTaskTriggerSource triggerSource,
            Exception exception,
            CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
