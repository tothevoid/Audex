using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.Constants;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Interfaces.User;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Interfaces.Messages;
using TickerQ.Utilities.Base;

namespace Audex.Application.Jobs
{
    [ScheduledJob(
        taskName: "SyncCurrencyRates",
        displayNameKey: LocalizationKeys.Jobs.SyncCurrencyRates.Name,
        descriptionKey: LocalizationKeys.Jobs.SyncCurrencyRates.Description,
        categoryKey: LocalizationKeys.Jobs.Categories.Currencies,
        defaultCronExpression: "0 0 * * * *",
        allowStartupCatchUp: true)]
    public class SyncCurrencyRatesJob : ScheduledJobBase
    {
        private readonly ICurrencyService _currencyService;
        private readonly IUserProfileService _userProfileService;
        private readonly ILocalizationService _localizer;

        public SyncCurrencyRatesJob(
            ICurrencyService currencyService,
            IUserProfileService userProfileService,
            ILocalizationService localizer,
            IDatabaseStateService databaseStateService,
            ISchedulerAttachmentService attachmentService,
            IServerNotifier serverNotifier)
            : base(databaseStateService, attachmentService, serverNotifier)
        {
            _currencyService = currencyService;
            _userProfileService = userProfileService;
            _localizer = localizer;
        }

        [TickerFunction(functionName: "SyncCurrencyRates")]
        public async Task SyncCurrencyRatesAsync(
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

            var userProfile = await _userProfileService.GetAsync();
            var mainCurrency = userProfile?.Currency;
            if (mainCurrency == null)
            {
                var allCurrencies = (await _currencyService.GetAllAsync()).ToList();
                mainCurrency = allCurrencies.FirstOrDefault(currency => currency.Id == CurrencyConstants.RUB)
                    ?? allCurrencies.FirstOrDefault();
            }

            if (mainCurrency == null)
            {
                throw new InvalidOperationException("Main currency for rate synchronization was not found.");
            }

            cancellationToken.ThrowIfCancellationRequested();
            var updatedCount = await _currencyService.SyncRatesAsync(mainCurrency, cancellationToken);

            var logMessage = await _localizer.GetForUserAsync(
                LocalizationKeys.Scheduler.SyncCurrencyRatesSuccess,
                UserProfileConstants.UserProfileId,
                updatedCount);

            return JobExecutionResult.Success(logMessage);
        }
    }
}

