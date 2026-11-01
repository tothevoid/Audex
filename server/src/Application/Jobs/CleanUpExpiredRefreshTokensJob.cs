using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Auth;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Notifications;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "CleanUpExpiredRefreshTokens",
        displayNameKey: LocalizationKeys.Jobs.CleanUpExpiredTokens.Name,
        descriptionKey: LocalizationKeys.Jobs.CleanUpExpiredTokens.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.Auth,
        defaultCronExpression: "0 0 0 * * *")]
    public class CleanUpExpiredRefreshTokensJob : ScheduledJobBase
    {
        private readonly IAuthService _authService;
        private readonly INotificationService _notificationService;
        private readonly ILocalizationService _localizer;

        public CleanUpExpiredRefreshTokensJob(
            IAuthService authService,
            INotificationService notificationService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _authService = authService;
            _notificationService = notificationService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "CleanUpExpiredRefreshTokens")]
        public async Task CleanUpExpiredRefreshTokensAsync(
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
            var deletedCount = await _authService.CleanUpExpiredRefreshTokensAsync(olderThanDays: 30, cancellationToken: cancellationToken);

            if (deletedCount > 0)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var title = await _localizer.GetForUserAsync(LocalizationKeys.Notifications.SessionCleanupTitle, UserProfileConstants.UserProfileId);
                var message = await _localizer.GetForUserAsync(LocalizationKeys.Notifications.SessionCleanupMessage, UserProfileConstants.UserProfileId, deletedCount);

                await _notificationService.CreateAsync(
                    title: title,
                    message: message,
                    severity: NotificationSeverity.Info,
                    category: "Auth",
                    userProfileId: UserProfileConstants.UserProfileId);
            }

            var logMessage = await _localizer.GetForUserAsync(LocalizationKeys.Scheduler.CleanUpSessionsSuccess, UserProfileConstants.UserProfileId, deletedCount);
            return JobExecutionResult.Success(logMessage);
        }
    }
}

