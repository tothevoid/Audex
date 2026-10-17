using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Interfaces.Securities;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "SyncSecurityPricesHistory",
        displayNameKey: LocalizationKeys.Jobs.SyncSecurityPricesHistory.Name,
        descriptionKey: LocalizationKeys.Jobs.SyncSecurityPricesHistory.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.Brokers,
        defaultCronExpression: "0 5 0 * * *")]
    public class SyncSecurityPricesHistoryJob : ScheduledJobBase
    {
        private readonly ISecurityPriceHistoryService _securityPriceHistoryService;
        private readonly ILocalizationService _localizer;

        public SyncSecurityPricesHistoryJob(
            ISecurityPriceHistoryService securityPriceHistoryService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _securityPriceHistoryService = securityPriceHistoryService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "SyncSecurityPricesHistory")]
        public async Task Execute(
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
            var syncedSecuritiesCount = await _securityPriceHistoryService.SyncActiveSecuritiesPriceHistoryAsync(cancellationToken);
            var logMessage = await _localizer.GetForUserAsync(
                LocalizationKeys.Scheduler.SyncSecurityPricesHistorySuccess,
                UserProfileConstants.UserProfileId,
                syncedSecuritiesCount);

            return JobExecutionResult.Success(logMessage);
        }
    }
}
