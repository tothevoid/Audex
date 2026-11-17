#nullable enable
using System;
using System.Globalization;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Localization;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Interfaces.User;
using Audex.Infrastructure.Interfaces.Messages;
using Audex.Shared.Constants;

namespace Audex.Application.Jobs
{
    public abstract class ScheduledJobBase : IScheduledJob
    {
        protected readonly IDatabaseStateService _databaseStateService;
        protected readonly ISchedulerAttachmentService _attachmentService;
        protected readonly IServerNotifier _serverNotifier;
        protected readonly IUserProfileService _userProfileService;

        protected virtual string TaskName =>
            GetType().GetCustomAttribute<ScheduledJobAttribute>()?.TaskName ?? GetType().Name;

        protected ScheduledJobBase(
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier,
            IUserProfileService userProfileService)
        {
            _databaseStateService = databaseStateService;
            _attachmentService = attachmentService;
            _serverNotifier = serverNotifier;
            _userProfileService = userProfileService;
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

            cancellationToken.ThrowIfCancellationRequested();

            var userProfile = await _userProfileService.GetAsync();
            if (userProfile == null || !AppLanguageExtensions.TryParse(userProfile.LanguageCode, out var appLanguage))
            {
                throw new InvalidOperationException(
                    $"Unable to resolve a valid user culture for background job '{TaskName}'. LanguageCode was '{userProfile?.LanguageCode}'.");
            }

            var cultureInfo = new CultureInfo(appLanguage.ToCode());
            CultureInfo.CurrentCulture = cultureInfo;
            CultureInfo.CurrentUICulture = cultureInfo;

            await _serverNotifier.SendToAllAsync(ServerNotificationEvents.ScheduledTaskStarted, TaskName);

            try
            {
                cancellationToken.ThrowIfCancellationRequested();

                var result = await ExecuteCoreAsync(triggerSource, cancellationToken);

                cancellationToken.ThrowIfCancellationRequested();

                if (result?.Attachment != null && occurrenceId.HasValue && occurrenceId.Value != Guid.Empty)
                {
                    await _attachmentService.SaveAttachmentAsync(occurrenceId.Value, result.Attachment);
                }

                await OnSuccessAsync(triggerSource, result, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                await OnCanceledAsync(triggerSource, cancellationToken);
                throw;
            }
            catch (Exception exception)
            {
                await OnFailureAsync(triggerSource, exception, cancellationToken);
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

        protected virtual Task OnCanceledAsync(
            ScheduledTaskTriggerSource triggerSource,
            CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
