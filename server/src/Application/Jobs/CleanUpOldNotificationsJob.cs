using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "CleanUpOldNotifications",
        displayNameKey: LocalizationKeys.Jobs.CleanUpOldNotifications.Name,
        descriptionKey: LocalizationKeys.Jobs.CleanUpOldNotifications.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.System,
        defaultCronExpression: "0 0 0 * * *")]
    public class CleanUpOldNotificationsJob : ScheduledJobBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILocalizationService _localizer;

        public CleanUpOldNotificationsJob(
            INotificationService notificationService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _notificationService = notificationService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "CleanUpOldNotifications")]
        public async Task CleanUpOldNotificationsAsync(
            TickerFunctionContext context,
            CancellationToken cancellationToken = default)
        {
            await ExecuteAsync(
                triggerSource: ScheduledTaskTriggerSource.Scheduled,
                cancellationToken: cancellationToken,
                occurrenceId: context.Id);
        }

        protected override async Task<JobExecutionResult> ExecuteCoreAsync(
            ScheduledTaskTriggerSource triggerSource,
            CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await _notificationService.CleanUpOldNotificationsAsync(olderThanDays: 90, cancellationToken: cancellationToken);
            var logMessage = await _localizer.GetForUserAsync(LocalizationKeys.Scheduler.CleanUpNotificationsSuccess, UserProfileConstants.UserProfileId, 90);
            return JobExecutionResult.Success(logMessage);
        }
    }
}

