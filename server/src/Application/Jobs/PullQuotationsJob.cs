using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "PullQuotations",
        displayNameKey: LocalizationKeys.Jobs.PullQuotations.Name,
        descriptionKey: LocalizationKeys.Jobs.PullQuotations.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.Brokers,
        defaultCronExpression: "0 */15 * * * *")]
    public class PullQuotationsJob : ScheduledJobBase
    {
        private readonly IBrokerAccountSecurityService _brokerAccountSecurityService;
        private readonly ILocalizationService _localizer;

        public PullQuotationsJob(
            IBrokerAccountSecurityService brokerAccountSecurityService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _brokerAccountSecurityService = brokerAccountSecurityService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "PullQuotations")]
        public async Task PullQuotationsAsync(
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
            await _brokerAccountSecurityService.PullQuotationsAsync(cancellationToken);
            var logMessage = await _localizer.GetForUserAsync(LocalizationKeys.Scheduler.PullQuotationsSuccess, UserProfileConstants.UserProfileId);
            return JobExecutionResult.Success(logMessage);
        }
    }
}

