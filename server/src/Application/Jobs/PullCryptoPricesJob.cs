using System;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Scheduler;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "PullCryptoPrices",
        displayNameKey: LocalizationKeys.Jobs.PullCryptoPrices.Name,
        descriptionKey: LocalizationKeys.Jobs.PullCryptoPrices.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.Crypto,
        defaultCronExpression: "0 */1 * * * *")]
    public class PullCryptoPricesJob : ScheduledJobBase
    {
        private readonly ICryptocurrencyService _cryptocurrencyService;
        private readonly ILocalizationService _localizer;

        public PullCryptoPricesJob(
            ICryptocurrencyService cryptocurrencyService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _cryptocurrencyService = cryptocurrencyService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "PullCryptoPrices")]
        public async Task Pull(
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
            var updatedCount = await _cryptocurrencyService.PullPricesAsync(cancellationToken);
            var logMessage = await _localizer.GetForUserAsync(
                LocalizationKeys.Scheduler.PullCryptoPricesSuccess,
                UserProfileConstants.UserProfileId,
                updatedCount);

            return JobExecutionResult.Success(logMessage);
        }
    }
}
