namespace Audex.Application.Constants
{
    public static class LocalizationKeys
    {
        public static class Notifications
        {
            public const string SessionCleanupTitle = "notifications.session_cleanup_title";
            public const string SessionCleanupMessage = "notifications.session_cleanup_message";
            public const string ReportGeneratedTitle = "notifications.report_generated_title";
            public const string ReportGeneratedMessage = "notifications.report_generated_message";
            public const string ReportGenerationFailedTitle = "notifications.report_generation_failed_title";
            public const string ReportGenerationFailedMessage = "notifications.report_generation_failed_message";
            public const string BackupReadyTitle = "notifications.backup_ready_title";
            public const string BackupReadyEncryptedTitle = "notifications.backup_ready_encrypted_title";
            public const string BackupReadyMessage = "notifications.backup_ready_message";
            public const string BackupFailedTitle = "notifications.backup_failed_title";
            public const string BackupFailedMessage = "notifications.backup_failed_message";
        }

        public static class Scheduler
        {
            public const string CleanUpSessionsSuccess = "scheduler.clean_up_sessions_success";
            public const string CleanUpNotificationsSuccess = "scheduler.clean_up_notifications_success";
            public const string AssetReportSuccess = "scheduler.asset_report_success";
            public const string BackupSuccess = "scheduler.backup_success";
            public const string PullQuotationsSuccess = "scheduler.pull_quotations_success";
            public const string PullCryptoPricesSuccess = "scheduler.pull_crypto_prices_success";
        }

        public static class Reports
        {
            public const string SheetTotals = "report.sheet_totals";
            public const string SheetInvestments = "report.sheet_investments";
            public const string SheetDebtors = "report.sheet_debtors";
            public const string SheetCash = "report.sheet_cash";
            public const string BankAccountHeader = "report.bank_account_header";
            public const string ColQuantity = "report.col_quantity";
            public const string ColRateToMainCurrency = "report.col_rate_to_main_currency";
            public const string ColPercentage = "report.col_percentage";
            public const string ColStartDate = "report.col_start_date";
            public const string ColDaysQuantity = "report.col_days_quantity";
            public const string ColIncome = "report.col_income";
            public const string ColTicker = "report.col_ticker";
            public const string ColPrice = "report.col_price";
            public const string ColTotal = "report.col_total";
            public const string ColName = "report.col_name";
            public const string ColPurchaseDate = "report.col_purchase_date";
            public const string ColPurchaseRate = "report.col_purchase_rate";
            public const string ColPnl = "report.col_pnl";
            public const string ColAmount = "report.col_amount";
            public const string RowTotal = "report.row_total";
            public const string RowTotalColon = "report.row_total_colon";
            public const string RowTotalDynamic = "report.row_total_dynamic";
            public const string RowPerMonth = "report.row_per_month";
            public const string RowOnlyAfterCompletion = "report.row_only_after_completion";
            public const string RowTotalStatic = "report.row_total_static";
            public const string RowTotalMainCurrency = "report.row_total_main_currency";
            public const string RowTotalInCurrency = "report.row_total_in_currency";
            public const string RowPnlColon = "report.row_pnl_colon";
            public const string TotalsPhysicalCash = "report.totals_physical_cash";
            public const string TotalsBankAccounts = "report.totals_bank_accounts";
            public const string TotalsCrypto = "report.totals_crypto";
            public const string TotalsDebts = "report.totals_debts";
            public const string TotalsInvestments = "report.totals_investments";
            public const string TotalsDeposits = "report.totals_deposits";
            public const string TotalsDepositsEarned = "report.totals_deposits_earned";
            public const string TotalsTotal = "report.totals_total";
            public const string TotalsInCurrency = "report.totals_in_currency";
        }

        public static class Jobs
        {
            public static class Categories
            {
                public const string Auth = "jobs.category_auth";
                public const string System = "jobs.category_system";
                public const string Reports = "jobs.category_reports";
                public const string Brokers = "jobs.category_brokers";
                public const string Crypto = "jobs.category_crypto";
                public const string General = "jobs.category_general";
            }

            public static class CleanUpExpiredTokens
            {
                public const string Name = "jobs.cleanup_expired_tokens_name";
                public const string Description = "jobs.cleanup_expired_tokens_desc";
            }

            public static class CleanUpOldNotifications
            {
                public const string Name = "jobs.cleanup_old_notifications_name";
                public const string Description = "jobs.cleanup_old_notifications_desc";
            }

            public static class AssetReport
            {
                public const string Name = "jobs.asset_report_name";
                public const string Description = "jobs.asset_report_desc";
            }

            public static class DatabaseBackup
            {
                public const string Name = "jobs.database_backup_name";
                public const string Description = "jobs.database_backup_desc";
            }

            public static class PullQuotations
            {
                public const string Name = "jobs.pull_quotations_name";
                public const string Description = "jobs.pull_quotations_desc";
            }

            public static class PullCryptoPrices
            {
                public const string Name = "jobs.pull_crypto_prices_name";
                public const string Description = "jobs.pull_crypto_prices_desc";
            }
        }

        public static class Auth
        {
            public const string InvalidCredentials = "auth.invalid_credentials";
            public const string UserNotFound = "auth.user_not_found";
            public const string TokenExpired = "auth.token_expired";
            public const string TokenRevoked = "auth.token_revoked";
        }

        public static class Errors
        {
            public const string GeneralError = "errors.general_error";
            public const string EntityNotFound = "errors.entity_not_found";
            public const string ValidationError = "errors.validation_error";
        }
    }
}
