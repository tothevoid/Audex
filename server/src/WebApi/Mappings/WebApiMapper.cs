using System.Collections.Generic;
using Riok.Mapperly.Abstractions;
using Audex.Application.DTO;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Common;
using Audex.Shared.Common;
using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Currencies;
using Audex.Application.DTO.Dashboard;
using Audex.Application.DTO.Debts;
using Audex.Application.DTO.Deposits;
using Audex.Application.DTO.Notifications;
using Audex.Application.DTO.Securities;
using Audex.Application.DTO.Transactions;
using Audex.Application.DTO.User;
using Audex.WebApi.Models.Accounts;
using Audex.WebApi.Models.Auth;
using Audex.WebApi.Models.Banks;
using Audex.WebApi.Models.Brokers;
using Audex.WebApi.Models.Common;
using Audex.WebApi.Models.Crypto;
using Audex.WebApi.Models.Currencies;
using Audex.WebApi.Models.Dashboard;
using Audex.WebApi.Models.Debts;
using Audex.WebApi.Models.Deposits;
using Audex.WebApi.Models.Deposits.Charts;
using Audex.WebApi.Models.Notifications;
using Audex.WebApi.Models.Securities;
using Audex.WebApi.Models.Transactions;
using Audex.WebApi.Models.User;
using Audex.WebApi.Models.Scheduler;

namespace Audex.WebApi.Mappings
{
    // EF navigation properties will be ignored by the mapper so RequiredMappingStrategy = None is ok.
    [Mapper(RequiredMappingStrategy = RequiredMappingStrategy.None)]
    public partial class WebApiMapper
    {
        public partial TransactionDto Map(TransactionModel model);
        public partial TransactionModel Map(TransactionDto dto);
        public partial IEnumerable<TransactionModel> Map(IEnumerable<TransactionDto> dtos);

        public partial AccountDto Map(AccountModel model);
        public partial AccountModel Map(AccountDto dto);
        public partial IEnumerable<AccountModel> Map(IEnumerable<AccountDto> dtos);

        public partial TransactionTypeDto Map(TransactionTypeModel model);
        public partial TransactionTypeModel Map(TransactionTypeDto dto);
        public partial IEnumerable<TransactionTypeModel> Map(IEnumerable<TransactionTypeDto> dtos);

        public partial DepositDto Map(DepositModel model);
        public partial DepositModel Map(DepositDto dto);
        public partial IEnumerable<DepositModel> Map(IEnumerable<DepositDto> dtos);

        public partial CurrencyDto Map(CurrencyModel model);
        public partial CurrencyModel Map(CurrencyDto dto);
        public partial IEnumerable<CurrencyModel> Map(IEnumerable<CurrencyDto> dtos);

        public partial AccountTypeDto Map(AccountTypeModel model);
        public partial AccountTypeModel Map(AccountTypeDto dto);
        public partial IEnumerable<AccountTypeModel> Map(IEnumerable<AccountTypeDto> dtos);

        public partial CurrencyTransactionDto Map(CurrencyTransactionModel model);
        public partial CurrencyTransactionModel Map(CurrencyTransactionDto dto);
        public partial IEnumerable<CurrencyTransactionModel> Map(IEnumerable<CurrencyTransactionDto> dtos);
        public partial CurrencyAccountSummaryModel Map(CurrencyAccountSummaryDto dto);

        public partial DepositsRangeModel Map(DepositsRangeDto dto);
        public partial DepositMonthSummary Map(DepositMonthSummaryDto dto);
        public partial DepositPayment Map(DepositPaymentDto dto);
        public partial PeriodPayment Map(PeriodPaymentDto dto);
        public partial DepositSummaryItem Map(DepositSummaryItemDto dto);
        public partial AccountTransferDto Map(AccountTransferModel model);
        public partial SecurityHistoryValueModel Map(SecurityHistoryValueDto dto);
        public partial SecurityHistoryValueDto Map(SecurityHistoryValueModel model);
        public partial IEnumerable<SecurityHistoryValueModel> Map(IEnumerable<SecurityHistoryValueDto> dtos);
        public partial SecurityHistoryModel Map(SecurityHistoryDto dto);
        public partial SecurityHistoryDto Map(SecurityHistoryModel model);

        public partial AccountCurrencySummaryModel Map(AccountCurrencySummaryDto dto);
        public partial IEnumerable<AccountCurrencySummaryModel> Map(IEnumerable<AccountCurrencySummaryDto> dtos);

        public partial SecurityDto Map(SecurityModel model);
        public partial SecurityModel Map(SecurityDto dto);
        public partial IEnumerable<SecurityModel> Map(IEnumerable<SecurityDto> dtos);

        public partial DividendDto Map(DividendModel model);
        public partial DividendModel Map(DividendDto dto);
        public partial IEnumerable<DividendModel> Map(IEnumerable<DividendDto> dtos);

        public partial SecurityTypeDto Map(SecurityTypeModel model);
        public partial SecurityTypeModel Map(SecurityTypeDto dto);
        public partial IEnumerable<SecurityTypeModel> Map(IEnumerable<SecurityTypeDto> dtos);

        public partial BrokerDto Map(BrokerModel model);
        public partial BrokerModel Map(BrokerDto dto);
        public partial IEnumerable<BrokerModel> Map(IEnumerable<BrokerDto> dtos);

        public partial BrokerAccountDto Map(BrokerAccountModel model);
        public partial BrokerAccountModel Map(BrokerAccountDto dto);
        public partial IEnumerable<BrokerAccountModel> Map(IEnumerable<BrokerAccountDto> dtos);

        public partial BrokerAccountSecurityDto Map(BrokerAccountSecurityModel model);
        public partial BrokerAccountSecurityModel Map(BrokerAccountSecurityDto dto);
        public partial IEnumerable<BrokerAccountSecurityModel> Map(IEnumerable<BrokerAccountSecurityDto> dtos);

        public partial BrokerAccountTypeDto Map(BrokerAccountTypeModel model);
        public partial BrokerAccountTypeModel Map(BrokerAccountTypeDto dto);
        public partial IEnumerable<BrokerAccountTypeModel> Map(IEnumerable<BrokerAccountTypeDto> dtos);

        public partial SecurityTransactionDto Map(SecurityTransactionModel model);
        public partial SecurityTransactionModel Map(SecurityTransactionDto dto);
        public partial IEnumerable<SecurityTransactionModel> Map(IEnumerable<SecurityTransactionDto> dtos);
        public partial PagedResult<SecurityTransactionModel> Map(PagedResult<SecurityTransactionDto> dto);
        public partial SecurityTransactionsFilterDto Map(GetAllSecuritiesTransactionsQuery query);

        public partial UserProfileDto Map(UserProfileModel model);
        public partial UserProfileModel Map(UserProfileDto dto);

        public partial GlobalDashboardModel Map(GlobalDashboardDto dto);
        public partial TransactionsGlobalDashboardModel Map(TransactionsGlobalDashboardDto dto);
        public partial BrokerAccountsGlobalDashboardModel Map(BrokerAccountsGlobalDashboardDto dto);
        public partial AccountsGlobalDashboardModel Map(AccountsGlobalDashboardDto dto);

        public partial DistributionModel Map(DistributionDto dto);
        public partial DistributionDto Map(DistributionModel model);

        public partial DebtsGlobalDashboardModel Map(DebtsGlobalDashboardDto dto);
        public partial DebtsGlobalDashboardDto Map(DebtsGlobalDashboardModel model);

        public partial DepositsGlobalDashboardDto Map(DepositsGlobalDashboardModel model);
        public partial DepositsGlobalDashboardModel Map(DepositsGlobalDashboardDto dto);

        public partial CryptoAccountsGlobalDashboardModel Map(CryptoAccountsGlobalDashboardDto dto);
        public partial CryptoAccountsGlobalDashboardDto Map(CryptoAccountsGlobalDashboardModel model);

        public partial BanksGlobalDashboardModel Map(BanksGlobalDashboardDto dto);
        public partial BanksGlobalDashboardDto Map(BanksGlobalDashboardModel model);

        public partial SecurityTransactionsHistoryModel Map(SecurityTransactionsHistoryDto dto);
        public partial IEnumerable<SecurityTransactionsHistoryModel> Map(IEnumerable<SecurityTransactionsHistoryDto> dtos);

        public partial DebtModel Map(DebtDto dto);
        public partial DebtDto Map(DebtModel model);
        public partial IEnumerable<DebtModel> Map(IEnumerable<DebtDto> dtos);

        public partial DebtTagModel Map(DebtTagDto dto);
        public partial DebtTagDto Map(DebtTagModel model);
        public partial IEnumerable<DebtTagModel> Map(IEnumerable<DebtTagDto> dtos);

        public partial DebtTagStatsModel Map(DebtTagStatsDto dto);
        public partial IEnumerable<DebtTagStatsModel> Map(IEnumerable<DebtTagStatsDto> dtos);

        public partial DebtPaymentModel Map(DebtPaymentDto dto);
        public partial DebtPaymentDto Map(DebtPaymentModel model);
        public partial IEnumerable<DebtPaymentModel> Map(IEnumerable<DebtPaymentDto> dtos);

        public partial DividendPaymentModel Map(DividendPaymentDto dto);
        public partial DividendPaymentDto Map(DividendPaymentModel model);
        public partial IEnumerable<DividendPaymentModel> Map(IEnumerable<DividendPaymentDto> dtos);

        public partial SecurityStatsModel Map(SecurityStatsDto dto);
        public partial SecurityStatsDto Map(SecurityStatsModel model);

        public partial CryptoAccountCryptocurrencyModel Map(CryptoAccountCryptocurrencyDto dto);
        public partial CryptoAccountCryptocurrencyDto Map(CryptoAccountCryptocurrencyModel model);
        public partial IEnumerable<CryptoAccountCryptocurrencyModel> Map(IEnumerable<CryptoAccountCryptocurrencyDto> dtos);

        public partial CryptoAccountModel Map(CryptoAccountDto dto);
        public partial CryptoAccountDto Map(CryptoAccountModel model);
        public partial IEnumerable<CryptoAccountModel> Map(IEnumerable<CryptoAccountDto> dtos);

        public partial CryptocurrencyModel Map(CryptocurrencyDto dto);
        public partial CryptocurrencyDto Map(CryptocurrencyModel model);
        public partial IEnumerable<CryptocurrencyModel> Map(IEnumerable<CryptocurrencyDto> dtos);

        public partial CryptoProviderModel Map(CryptoProviderDto dto);
        public partial CryptoProviderDto Map(CryptoProviderModel model);
        public partial IEnumerable<CryptoProviderModel> Map(IEnumerable<CryptoProviderDto> dtos);

        public partial BrokerAccountFundsTransferModel Map(BrokerAccountFundsTransferDto dto);
        public partial BrokerAccountFundsTransferDto Map(BrokerAccountFundsTransferModel model);
        public partial IEnumerable<BrokerAccountFundsTransferModel> Map(IEnumerable<BrokerAccountFundsTransferDto> dtos);

        public partial BrokerAccountSummaryModel Map(BrokerAccountSummaryDto dto);
        public partial BrokerAccountSummaryDto Map(BrokerAccountSummaryModel model);

        public partial BrokerAccountStatsModel Map(BrokerAccountStatsDto dto);
        public partial BrokerAccountStatsDto Map(BrokerAccountStatsModel model);

        public partial BrokerAccountTransfersStatsModel Map(BrokerAccountTransfersStatsDto dto);
        public partial BrokerAccountTransfersStatsDto Map(BrokerAccountTransfersStatsModel model);

        public partial BrokerAccountMonthTransferModel Map(BrokerAccountMonthTransferDto dto);
        public partial BrokerAccountMonthTransferDto Map(BrokerAccountMonthTransferModel model);
        public partial IEnumerable<BrokerAccountMonthTransferModel> Map(IEnumerable<BrokerAccountMonthTransferDto> dtos);

        public partial BrokerAccountDayTransferModel Map(BrokerAccountDayTransferDto dto);
        public partial BrokerAccountDayTransferDto Map(BrokerAccountDayTransferModel model);
        public partial IEnumerable<BrokerAccountDayTransferModel> Map(IEnumerable<BrokerAccountDayTransferDto> dtos);

        public partial BrokerAccountTransferAccountValueModel Map(BrokerAccountTransferAccountValueDto dto);
        public partial BrokerAccountTransferAccountValueDto Map(BrokerAccountTransferAccountValueModel model);
        public partial IEnumerable<BrokerAccountTransferAccountValueModel> Map(IEnumerable<BrokerAccountTransferAccountValueDto> dtos);

        public partial BrokerAccountTransfersAvailableDatesModel Map(BrokerAccountTransfersAvailableDatesDto dto);
        public partial BrokerAccountTransfersAvailableDatesDto Map(BrokerAccountTransfersAvailableDatesModel model);

        public partial BrokerAccountMonthTransfersHistoryModel Map(BrokerAccountMonthTransfersHistoryDto dto);
        public partial BrokerAccountMonthTransfersHistoryDto Map(BrokerAccountMonthTransfersHistoryModel model);

        public partial BrokerAccountYearTransfersHistoryModel Map(BrokerAccountYearTransfersHistoryDto dto);
        public partial BrokerAccountYearTransfersHistoryDto Map(BrokerAccountYearTransfersHistoryModel model);

        public partial BrokerAccountDailyStatsModel Map(BrokerAccountDailyStatsDto dto);
        public partial BrokerAccountDailyStatsDto Map(BrokerAccountDailyStatsModel model);

        public partial BrokerAccountDailySecurityStatsModel Map(BrokerAccountDailySecurityStatsDto dto);
        public partial BrokerAccountDailySecurityStatsDto Map(BrokerAccountDailySecurityStatsModel model);

        public partial BankModel Map(BankDto dto);
        public partial BankDto Map(BankModel model);
        public partial IEnumerable<BankModel> Map(IEnumerable<BankDto> dtos);

        public partial PaginationConfigModel Map(PaginationConfigDto dto);

        public partial LoginModel Map(LoginDto dto);
        public partial LoginDto Map(LoginModel model);

        public partial BrokerAccountTaxDeductionDto Map(BrokerAccountTaxDeductionModel model);
        public partial BrokerAccountTaxDeductionModel Map(BrokerAccountTaxDeductionDto dto);
        public partial IEnumerable<BrokerAccountTaxDeductionModel> Map(IEnumerable<BrokerAccountTaxDeductionDto> dtos);

        public partial BrokerAccountPortfolioModel Map(BrokerAccountPortfolioDto dto);

        public partial NotificationDto Map(NotificationModel model);
        public partial NotificationModel Map(NotificationDto dto);
        public partial IEnumerable<NotificationModel> Map(IEnumerable<NotificationDto> dtos);

        public partial ScheduledTaskDefinitionModel Map(Audex.Application.DTO.Scheduler.ScheduledTaskDefinitionDto dto);
        public partial IEnumerable<ScheduledTaskDefinitionModel> Map(IEnumerable<Audex.Application.DTO.Scheduler.ScheduledTaskDefinitionDto> dtos);

        public partial Audex.Application.DTO.Scheduler.CreateScheduledTaskDto Map(Audex.WebApi.Models.Scheduler.CreateScheduledTaskModel model);

        public partial ScheduledTaskModel Map(Audex.Application.DTO.Scheduler.ScheduledTaskDto dto);
        public partial IEnumerable<ScheduledTaskModel> Map(IEnumerable<Audex.Application.DTO.Scheduler.ScheduledTaskDto> dtos);

        public partial ScheduledTaskJournalModel Map(Audex.Application.DTO.Scheduler.ScheduledTaskJournalDto dto);
        public partial IEnumerable<ScheduledTaskJournalModel> Map(IEnumerable<Audex.Application.DTO.Scheduler.ScheduledTaskJournalDto> dtos);

        public partial ScheduledTaskAttachmentModel Map(Audex.Application.DTO.Scheduler.ScheduledTaskAttachmentDto dto);
        public partial IEnumerable<ScheduledTaskAttachmentModel> Map(IEnumerable<Audex.Application.DTO.Scheduler.ScheduledTaskAttachmentDto> dtos);

        public partial Audex.Application.DTO.Scheduler.UpdateScheduleDto Map(Audex.WebApi.Models.Scheduler.UpdateScheduleModel model);
        public partial CryptoAccountStatsModel Map(CryptoAccountStatsDto dto);
    }
}
