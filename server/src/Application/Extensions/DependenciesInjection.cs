using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Integrations.Crypto.CoinGecko;
using Audex.Application.Integrations.Currency;
using Audex.Application.Integrations.Stock.Moex;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Auth;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Dashboard;
using Audex.Application.Interfaces.Debts;
using Audex.Application.Interfaces.Deposits;
using Audex.Application.Interfaces.FileStorage;
using Audex.Application.Interfaces.Integrations.Crypto;
using Audex.Application.Interfaces.Integrations.Currency;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Notifications;
using Audex.Application.Interfaces.Reports;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Interfaces.User;
using Audex.Application.Mappings;
using Audex.Application.Services.Accounts;
using Audex.Application.Services.Auth;
using Audex.Application.Services.Banks;
using Audex.Application.Services.Brokers;
using Audex.Application.Services.Crypto;
using Audex.Application.Services.Currencies;
using Audex.Application.Services.Dashboard;
using Audex.Application.Services.Debts;
using Audex.Application.Services.Deposits;
using Audex.Application.Services.FileStorage;
using Audex.Application.Services.Localization;
using Audex.Application.Services.Notifications;
using Audex.Application.Services.Reports;
using Audex.Application.Services.Securities;
using Audex.Application.Services.Transactions;
using Audex.Application.Services.User;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Services.DatabaseBackup;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Services.Scheduler;
using Audex.Application.Jobs;

namespace Audex.Application.Extensions
{
    public static class DependenciesInjection
    {
        public static IServiceCollection AddApplicationServices(
            this IServiceCollection services)
        {
            services.AddSingleton<ApplicationMapper>();
            services.AddTransient<ITransactionsService, TransactionsService>();
            services.AddTransient<IAccountService, AccountService>();
            services.AddTransient<IDepositService, DepositService>();
            services.AddTransient<ITransactionTypeService, TransactionTypeService>();
            services.AddTransient<ICurrencyService, CurrencyService>();
            services.AddTransient<IAccountTypeService, AccountTypeService>();
            services.AddTransient<IBrokerAccountSecurityService, BrokerAccountSecurityService>();
            services.AddTransient<IBrokerAccountService, BrokerAccountService>();
            services.AddTransient<IBrokerAccountTypeService, BrokerAccountTypeService>();
            services.AddTransient<IBrokerService, BrokerService>();
            services.AddTransient<IBrokerAccountSummaryService, BrokerAccountSummaryService>();
            services.AddTransient<ISecurityService, SecurityService>();
            services.AddTransient<ISecurityTransactionService, SecurityTransactionService>();
            services.AddTransient<ISecurityTypeService, SecurityTypeService>();
            services.AddTransient<IDividendService, DividendService>();
            services.AddTransient<IUserProfileService, UserProfileService>();
            services.AddTransient<IDashboardService, DashboardService>();
            services.AddTransient<IDebtService, DebtService>();
            services.AddTransient<IDebtTagService, DebtTagService>();
            services.AddTransient<INotificationService, NotificationService>();
            services.AddTransient<IDebtPaymentService, DebtPaymentService>();
            services.AddTransient<IDividendPaymentService, DividendPaymentService>();
            services.AddTransient<ICurrencyTransactionService, CurrencyTransactionService>();
            services.AddTransient<IBrokerAccountFundsTransferService, BrokerAccountFundsTransferService>();
            services.AddTransient<IBrokerAccountTaxDeductionService, BrokerAccountTaxDeductionService>();
            services.AddTransient<ICryptoAccountService, CryptoAccountService>();
            services.AddTransient<ICryptoAccountCryptocurrencyService, CryptoAccountCryptocurrencyService>();
            services.AddTransient<ICryptocurrencyService, CryptocurrencyService>();
            services.AddTransient<ICryptoProviderService, CryptoProviderService>();
            services.AddTransient<ICryptoAccountStatsService, CryptoAccountStatsService>();
            services.AddTransient<IBankService, BankService>();
            services.AddTransient<IAuthService, AuthService>();
            services.AddSingleton<IPasswordHasherService, PasswordHasherService>();
            services.AddSingleton<ITranslationProvider, TranslationProvider>();
            services.AddTransient<ILocalizationService, LocalizationService>();

            services.AddSingleton<IDatabaseStateService, DatabaseStateService>();
            services.AddSingleton<IBackupEncryptionService, BackupEncryptionService>();
            services.AddTransient<IDatabaseBackupService, DatabaseBackupService>();

            services.AddTransient<IAllAssetsReportService, AllAssetsReportService>();
            services.AddTransient<IBrokerAccountPortfolioHistoryService, BrokerAccountPortfolioHistoryService>();
            services.AddSingleton<IPullQuotationsService, PullQuotationsService>();

            //TODO: make factory
            //TODO: possible change AddTransient to AddSingleton
            services.AddTransient<IStockConnector, MoexConnector>();
            services.AddTransient<ICurrencyGrabber, CbrCurrencyGrabber>();
            services.AddTransient<CoinGeckoApiClient>();
            services.AddTransient<ICryptoConnector, CoinGeckoConnector>();

            services.AddScoped<IFileStorageService, FileStorageService>();

            services.AddSingleton<IScheduledJobRegistry, ScheduledJobRegistry>();
            services.AddTransient<IScheduleExecutor, ScheduleExecutor>();
            services.AddTransient<ISchedulerTaskService, SchedulerTaskService>();
            services.AddTransient<ISchedulerJournalService, SchedulerJournalService>();
            services.AddTransient<ISchedulerAttachmentService, SchedulerAttachmentService>();

            services.AddTransient<IScheduledJob, AssetReportJob>();
            services.AddTransient<IScheduledJob, DatabaseBackupJob>();
            services.AddTransient<IScheduledJob, PullQuotationsJob>();
            services.AddTransient<IScheduledJob, CleanUpOldNotificationsJob>();
            services.AddTransient<IScheduledJob, CleanUpExpiredRefreshTokensJob>();
            services.AddTransient<IScheduledJob, PullCryptoPricesJob>();

            services.AddTransient<AssetReportJob>();
            services.AddTransient<DatabaseBackupJob>();
            services.AddTransient<PullQuotationsJob>();
            services.AddTransient<CleanUpOldNotificationsJob>();
            services.AddTransient<CleanUpExpiredRefreshTokensJob>();
            services.AddTransient<PullCryptoPricesJob>();

            return services;
        }
    }
}

