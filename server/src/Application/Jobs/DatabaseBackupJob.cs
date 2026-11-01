using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.FileStorage;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Notifications;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "DatabaseBackup",
        displayNameKey: LocalizationKeys.Jobs.DatabaseBackup.Name,
        descriptionKey: LocalizationKeys.Jobs.DatabaseBackup.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.System,
        defaultCronExpression: "0 0 3 * * 0")]
    public class DatabaseBackupJob : ScheduledJobBase
    {
        private readonly IDatabaseBackupService _backupService;
        private readonly IFileStorageService _fileStorageService;
        private readonly INotificationService _notificationService;
        private readonly ILocalizationService _localizer;
        private string _customPassword;

        public DatabaseBackupJob(
            IDatabaseBackupService backupService,
            IFileStorageService fileStorageService,
            INotificationService notificationService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _backupService = backupService;
            _fileStorageService = fileStorageService;
            _notificationService = notificationService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "DatabaseBackup")]
        public async Task BackupDatabaseAsync(
            TickerFunctionContext context,
            CancellationToken cancellationToken = default)
        {
            await ExecuteAsync(
                triggerSource: ScheduledTaskTriggerSource.Scheduled,
                cancellationToken: cancellationToken,
                occurrenceId: context.Id);
        }

        public async Task ExecuteBackupAsync(
            ScheduledTaskTriggerSource triggerSource = ScheduledTaskTriggerSource.Manual,
            string password = null,
            CancellationToken cancellationToken = default)
        {
            _customPassword = password;
            await ExecuteAsync(triggerSource, cancellationToken);
        }

        protected override async Task<JobExecutionResult> ExecuteCoreAsync(
            ScheduledTaskTriggerSource triggerSource,
            CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var password = _customPassword;
            _customPassword = null;

            var backup = await _backupService.CreateBackupAsync(password, cancellationToken: cancellationToken);
            cancellationToken.ThrowIfCancellationRequested();

            var objectKey = $"{DateTime.UtcNow:yyyy/MM}/{backup.FileName}";

            await _fileStorageService.UploadBytesAsync(
                bucketName: "backups",
                data: backup.Data,
                key: objectKey,
                contentType: backup.ContentType,
                cancellationToken: cancellationToken);

            cancellationToken.ThrowIfCancellationRequested();

            var attachment = new ScheduledTaskAttachment
            {
                Id = Guid.NewGuid(),
                FileName = backup.FileName,
                BucketName = "backups",
                StoragePath = objectKey,
                ContentType = backup.ContentType,
                FileSizeBytes = backup.FileSizeBytes,
                CreatedAt = DateTime.UtcNow
            };

            var titleKey = backup.IsEncrypted ? LocalizationKeys.Notifications.BackupReadyEncryptedTitle : LocalizationKeys.Notifications.BackupReadyTitle;
            var title = await _localizer.GetForUserAsync(titleKey, UserProfileConstants.UserProfileId);
            var message = await _localizer.GetForUserAsync(LocalizationKeys.Notifications.BackupReadyMessage, UserProfileConstants.UserProfileId, backup.FileName);

            await _notificationService.CreateAsync(
                title: title,
                message: message,
                severity: NotificationSeverity.Success,
                actionUrl: "/scheduler?tab=journal",
                category: "Scheduler",
                userProfileId: UserProfileConstants.UserProfileId);

            var encryptedPrefix = backup.IsEncrypted ? "encrypted " : "";
            var logMessage = await _localizer.GetForUserAsync(LocalizationKeys.Scheduler.BackupSuccess, UserProfileConstants.UserProfileId, encryptedPrefix, backup.FileSizeBytes / 1024.0);

            return JobExecutionResult.Success(
                logMessage: logMessage,
                attachment: attachment);
        }

        protected override async Task OnFailureAsync(
            ScheduledTaskTriggerSource triggerSource,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var title = await _localizer.GetForUserAsync(LocalizationKeys.Notifications.BackupFailedTitle, UserProfileConstants.UserProfileId);
            var message = await _localizer.GetForUserAsync(LocalizationKeys.Notifications.BackupFailedMessage, UserProfileConstants.UserProfileId, exception.Message);

            await _notificationService.CreateAsync(
                title: title,
                message: message,
                severity: NotificationSeverity.Danger,
                actionUrl: "/scheduler?tab=journal",
                category: "Scheduler",
                userProfileId: UserProfileConstants.UserProfileId);
        }
    }
}
