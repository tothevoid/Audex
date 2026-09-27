using ClosedXML.Excel;
using Audex.Application.Constants;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.Dashboard;
using Audex.Application.DTO.Reports;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Dashboard;
using Audex.Application.Interfaces.Debts;
using Audex.Application.Interfaces.Deposits;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Reports;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Interfaces.User;
using Audex.Infrastructure.Constants;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Audex.Application.Services.Reports
{
    public class AllAssetsReportService : IAllAssetsReportService
    {
        private readonly IDepositService _depositService;
        private readonly IAccountService _accountService;
        private readonly IBankService _bankService;
        private readonly IBrokerAccountService _brokerAccountService;
        private readonly IBrokerAccountSecurityService _brokerAccountSecurityService;
        private readonly IDebtService _debtService;
        private readonly IDashboardService _dashboardService;
        private readonly ICurrencyTransactionService _currencyTransactionService;
        private readonly ILocalizationService _localizer;

        public AllAssetsReportService(
            IDepositService depositService, 
            IAccountService accountService, 
            IBankService bankService, 
            IBrokerAccountService brokerAccountService, 
            IBrokerAccountSecurityService brokerAccountSecurityService,
            IDebtService debtService,
            IDashboardService dashboardService,
            ICurrencyTransactionService currencyTransactionService,
            ILocalizationService localizer)
        {
            _depositService = depositService;
            _accountService = accountService;
            _bankService = bankService;
            _brokerAccountService = brokerAccountService;
            _brokerAccountSecurityService = brokerAccountSecurityService;
            _debtService = debtService;
            _dashboardService = dashboardService;
            _currencyTransactionService = currencyTransactionService;
            _localizer = localizer;
        }

        public async Task<GeneratedReportDto> CreateReportAsync()
        {
            var lang = await _localizer.GetUserLanguageAsync();

            using var workbook = new XLWorkbook();

            var totalsSheet = workbook.Worksheets.Add(_localizer.Get(LocalizationKeys.Reports.SheetTotals, lang));
            await CreateTotalsWorksheet(totalsSheet, lang);
            totalsSheet.Columns().AdjustToContents();

            var bankAccounts = await _bankService.GetAllAsync();
            foreach (var bank in bankAccounts)
            {
                await CreateBankAccountWorksheet(workbook, bank, lang);
            }

            var cashAccountsSheet = await GetCashAccounts();
            foreach (var cashAccount in cashAccountsSheet)
            {
                var sheetName = _localizer.Get(LocalizationKeys.Reports.SheetCash, lang, cashAccount.Name);
                var accountWorksheet = workbook.Worksheets.Add(sheetName);
                await CreateCashAccountsWorksheet(accountWorksheet, cashAccount, lang);
                accountWorksheet.Columns().AdjustToContents();
            }

            var brokerSheet = workbook.Worksheets.Add(_localizer.Get(LocalizationKeys.Reports.SheetInvestments, lang));
            await CreateBrokerAccountWorksheet(brokerSheet, lang);
            brokerSheet.Columns().AdjustToContents();

            var debtorsSheet = workbook.Worksheets.Add(_localizer.Get(LocalizationKeys.Reports.SheetDebtors, lang));
            await CreateDebtorsWorksheet(debtorsSheet, lang);
            debtorsSheet.Columns().AdjustToContents();

            using var ms = new System.IO.MemoryStream();
            workbook.SaveAs(ms);

            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HHmm");
            var fileName = $"AllAssetsReport_{timestamp}.xlsx";

            return new GeneratedReportDto
            {
                Data = ms.ToArray(),
                FileName = fileName,
                ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };
        }

        private async Task CreateBankAccountWorksheet(IXLWorkbook workbook, BankDto bank, string lang)
        {
            var accounts = (await _accountService.GetAllAsync(true))
                .Where(account => account.BankId == bank.Id).ToList();

            var deposits = (await _depositService.GetAllActiveAsync())
                .Where(deposit => deposit.BankId == bank.Id).ToList();

            if (!accounts.Any() && !deposits.Any())
            {
                return;
            }

            var worksheet = workbook.Worksheets.Add(bank.Name);

            worksheet.Cell("A1").Value = _localizer.Get(LocalizationKeys.Reports.BankAccountHeader, lang, bank.Name);
            worksheet.Cell("B1").Value = _localizer.Get(LocalizationKeys.Reports.ColQuantity, lang);
            worksheet.Cell("C1").Value = _localizer.Get(LocalizationKeys.Reports.ColRateToMainCurrency, lang);
            worksheet.Cell("D1").Value = _localizer.Get(LocalizationKeys.Reports.ColPercentage, lang);
            worksheet.Cell("E1").Value = _localizer.Get(LocalizationKeys.Reports.ColStartDate, lang);
            worksheet.Cell("F1").Value = _localizer.Get(LocalizationKeys.Reports.ColDaysQuantity, lang);
            worksheet.Cell("G1").Value = _localizer.Get(LocalizationKeys.Reports.ColIncome, lang);

            int reservedRowsBeforeSummaries = 20;

            decimal total = 0;
            decimal totalDynamic = 0;
            decimal totalStatic = 0;
            decimal incomeInMonth = 0;
            decimal notConfirmedIncomes = 0;

            int currentRow = 2;

            foreach (var account in accounts)
            {
                worksheet.Cell($"A{currentRow}").Value = account.Name;
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), account.Balance);
                SetFinanceValue(worksheet.Cell($"C{currentRow}"), account.Currency.Rate);

                totalStatic += account.Balance * account.Currency.Rate;
                total += account.Balance * account.Currency.Rate;

                currentRow++;
            }

            var currentDate = DateOnly.FromDateTime(DateTime.Now);

            foreach (var deposit in deposits)
            {
                var income = deposit.InitialAmount / 365 / 100 * deposit.Percentage *
                             (currentDate.DayNumber - deposit.From.DayNumber);

                int totalDays = deposit.To.DayNumber - deposit.From.DayNumber;
                int daysPassed = currentDate.DayNumber - deposit.From.DayNumber;

                worksheet.Cell($"A{currentRow}").Value = deposit.Name;
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), deposit.InitialAmount);
                SetFinanceValue(worksheet.Cell($"C{currentRow}"), deposit.Currency.Rate);
                worksheet.Cell($"D{currentRow}").Value = deposit.Percentage;
                worksheet.Cell($"E{currentRow}").Value = deposit.From.ToDateTime(new TimeOnly());
                worksheet.Cell($"F{currentRow}").Value = totalDays;
                SetFinanceValue(worksheet.Cell($"G{currentRow}"), deposit.EstimatedEarn / totalDays * daysPassed);

                total += deposit.InitialAmount + income;
                totalDynamic += deposit.InitialAmount;
                notConfirmedIncomes += income;
                incomeInMonth += deposit.InitialAmount / 12 / 100 * deposit.Percentage;

                currentRow++;
            }

            worksheet.Cell($"A{reservedRowsBeforeSummaries}").Value = _localizer.Get(LocalizationKeys.Reports.RowTotal, lang);
            SetFinanceValue(worksheet.Cell($"B{reservedRowsBeforeSummaries++}"), total);

            worksheet.Cell($"A{reservedRowsBeforeSummaries}").Value = _localizer.Get(LocalizationKeys.Reports.RowTotalDynamic, lang);
            SetFinanceValue(worksheet.Cell($"B{reservedRowsBeforeSummaries++}"), totalDynamic);

            worksheet.Cell($"A{reservedRowsBeforeSummaries}").Value = _localizer.Get(LocalizationKeys.Reports.RowPerMonth, lang);
            SetFinanceValue(worksheet.Cell($"B{reservedRowsBeforeSummaries++}"), incomeInMonth);

            worksheet.Cell($"A{reservedRowsBeforeSummaries}").Value = _localizer.Get(LocalizationKeys.Reports.RowOnlyAfterCompletion, lang);
            SetFinanceValue(worksheet.Cell($"B{reservedRowsBeforeSummaries++}"), notConfirmedIncomes);

            worksheet.Cell($"A{reservedRowsBeforeSummaries}").Value = _localizer.Get(LocalizationKeys.Reports.RowTotalStatic, lang);
            SetFinanceValue(worksheet.Cell($"B{reservedRowsBeforeSummaries}"), totalStatic);

            worksheet.Columns().AdjustToContents();
        }

        private async Task CreateBrokerAccountWorksheet(IXLWorksheet worksheet, string lang)
        {
            var accounts = await _brokerAccountService.GetAllAsync();

            worksheet.Cell("A1").Value = _localizer.Get(LocalizationKeys.Reports.ColTicker, lang);
            worksheet.Cell("B1").Value = _localizer.Get(LocalizationKeys.Reports.ColQuantity, lang);
            worksheet.Cell("C1").Value = _localizer.Get(LocalizationKeys.Reports.ColPrice, lang);
            worksheet.Cell("D1").Value = _localizer.Get(LocalizationKeys.Reports.ColTotal, lang);

            var currentRow = 2;

            var accountsByCurrency = accounts.GroupBy(account => account.CurrencyId);

            foreach (var accountsByCurrencyGroup in accountsByCurrency)
            {
                var amount = accountsByCurrencyGroup.Sum(account => account.MainCurrencyAmount);

                var currency = accountsByCurrencyGroup.First().Currency;

                worksheet.Cell($"A{currentRow}").Value = currency.Name;
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), amount);
                SetFinanceValue(worksheet.Cell($"C{currentRow}"), currency.Rate);
                SetFinanceValue(worksheet.Cell($"D{currentRow}"), currency.Rate * amount);

                currentRow++;
            }

            var brokerAccountSecurities = await _brokerAccountSecurityService.GetAllAsync(true);

            foreach (var brokerAccountSecurity in brokerAccountSecurities)
            {
                worksheet.Cell($"A{currentRow}").Value = brokerAccountSecurity.Security.Ticker;
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), brokerAccountSecurity.Quantity);
                SetFinanceValue(worksheet.Cell($"C{currentRow}"), brokerAccountSecurity.Security.ActualPrice);
                SetFinanceValue(worksheet.Cell($"D{currentRow}"), brokerAccountSecurity.Security.ActualPrice * brokerAccountSecurity.Quantity);

                currentRow++;
            }
        }

        private async Task CreateDebtorsWorksheet(IXLWorksheet worksheet, string lang)
        {
            worksheet.Cell("A1").Value = _localizer.Get(LocalizationKeys.Reports.ColName, lang);
            worksheet.Cell("B1").Value = _localizer.Get(LocalizationKeys.Reports.ColQuantity, lang);
            worksheet.Cell("C1").Value = _localizer.Get(LocalizationKeys.Reports.ColRateToMainCurrency, lang);

            var activeDebtors = await _debtService.GetAllAsync(true);

            int currentRow = 2;
            decimal total = 0;

            foreach (var debt in activeDebtors)
            {
                worksheet.Cell($"A{currentRow}").Value = debt.Name;
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), debt.Amount);
                SetFinanceValue(worksheet.Cell($"C{currentRow}"), debt.Currency.Rate);

                total += debt.Currency.Rate * debt.Amount;

                currentRow++;
            }

            int totalsRow = 20;
            worksheet.Cell($"A{totalsRow}").Value = _localizer.Get(LocalizationKeys.Reports.RowTotalColon, lang);
            SetFinanceValue(worksheet.Cell($"B{totalsRow}"), total);
        }

        private async Task CreateTotalsWorksheet(IXLWorksheet worksheet, string lang)
        {
            var dashboard = await _dashboardService.GetDashboardAsync();

            var currentRow = 1;

            foreach (var cash in dashboard.AccountsGlobalDashboard.CashDistribution)
            {
                worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsPhysicalCash, lang, cash.Name);
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), cash.ConvertedAmount);
                SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : cash.ConvertedAmount / dashboard.Total);
                currentRow++;
            }

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsBankAccounts, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.AccountsGlobalDashboard.TotalBankAccount);
            SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : dashboard.AccountsGlobalDashboard.TotalBankAccount / dashboard.Total);
            currentRow++;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsCrypto, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.CryptoAccountsGlobalDashboard.Total);
            SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : dashboard.CryptoAccountsGlobalDashboard.Total / dashboard.Total);
            currentRow++;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsDebts, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.DebtsGlobalDashboard.Total);
            SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : dashboard.DebtsGlobalDashboard.Total / dashboard.Total);
            currentRow++;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsInvestments, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.BrokerAccountsGlobalDashboard.Total);
            SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : dashboard.BrokerAccountsGlobalDashboard.Total / dashboard.Total);
            currentRow++;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsDeposits, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.DepositsGlobalDashboard.TotalStartedAmount);
            SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : dashboard.DepositsGlobalDashboard.TotalStartedAmount / dashboard.Total);
            currentRow++;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsDepositsEarned, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.DepositsGlobalDashboard.TotalEarned);
            SetPercentValue(worksheet.Cell($"C{currentRow}"), dashboard.Total == 0 ? 0 : dashboard.DepositsGlobalDashboard.TotalEarned / dashboard.Total);
            currentRow++;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsTotal, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), dashboard.Total);

            currentRow += 2;

            worksheet.Cell($"A{currentRow++}").Value = _localizer.Get(LocalizationKeys.Reports.TotalsInCurrency, lang);

            var currencyDistributions = GetCurrencyDistributions(dashboard);

            foreach (var currency in currencyDistributions)
            {
                worksheet.Cell($"A{currentRow}").Value = currency.Key;
                SetFinanceValue(worksheet.Cell($"B{currentRow}"), currency.Value);
                currentRow++;
            }
        }

        public async Task CreateCashAccountsWorksheet(IXLWorksheet worksheet, AccountDto cashAccount, string lang)
        {
            worksheet.Cell("A1").Value = _localizer.Get(LocalizationKeys.Reports.ColName, lang);
            worksheet.Cell("B1").Value = _localizer.Get(LocalizationKeys.Reports.ColQuantity, lang);
            worksheet.Cell("C1").Value = _localizer.Get(LocalizationKeys.Reports.ColRateToMainCurrency, lang);
            worksheet.Cell("D1").Value = _localizer.Get(LocalizationKeys.Reports.ColPurchaseDate, lang);
            worksheet.Cell("E1").Value = _localizer.Get(LocalizationKeys.Reports.ColPurchaseRate, lang);
            worksheet.Cell("F1").Value = _localizer.Get(LocalizationKeys.Reports.ColPnl, lang);
            worksheet.Cell("G1").Value = _localizer.Get(LocalizationKeys.Reports.ColAmount, lang);

            int currentRow = 2;
            decimal totalInMainCurrency = 0;
            decimal totalPnL = 0;
            decimal total = 0;

            var transactionsResult = await _currencyTransactionService.GetAllAsync(new CurrencyTransactionFilterDto
            {
                AccountId = cashAccount.Id
            });
            var transactions = transactionsResult.Items
                .Where(transaction => transaction.DestinationAccountId == cashAccount.Id).ToList();

            foreach (var transaction in transactions.OrderBy(transaction => transaction.Date))
            {
                worksheet.Cell($"A{currentRow}").Value = transaction.Name;
                worksheet.Cell($"B{currentRow}").Value = transaction.Amount;
                SetFinanceValue(worksheet.Cell($"C{currentRow}"), transaction.DestinationAccount.Currency.Rate);
                worksheet.Cell($"D{currentRow}").Value = transaction.Date.ToString("dd.MM.yyyy");
                SetFinanceValue(worksheet.Cell($"E{currentRow}"), transaction.Rate);

                var pnl = transaction.Amount * transaction.DestinationAccount.Currency.Rate - transaction.Amount * transaction.Rate;

                SetFinanceValue(worksheet.Cell($"F{currentRow}"), pnl);
                SetFinanceValue(worksheet.Cell($"G{currentRow}"), transaction.Amount * transaction.Rate);

                totalInMainCurrency += transaction.Amount * transaction.DestinationAccount.Currency.Rate;
                total += transaction.Amount;
                totalPnL += pnl;
                currentRow++;
            }

            currentRow += 2;

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.RowTotalMainCurrency, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow++}"), totalInMainCurrency);

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.RowTotalInCurrency, lang, cashAccount.Currency.Name);
            SetFinanceValue(worksheet.Cell($"B{currentRow++}"), total);

            worksheet.Cell($"A{currentRow}").Value = _localizer.Get(LocalizationKeys.Reports.RowPnlColon, lang);
            SetFinanceValue(worksheet.Cell($"B{currentRow}"), totalPnL);
        }

        private Dictionary<string, decimal> GetCurrencyDistributions(GlobalDashboardDto dashboard)
        {
            var totalCurrencies = new Dictionary<string, decimal>();

            var summaryDistributions = new List<DistributionDto>();

            summaryDistributions.AddRange(dashboard.AccountsGlobalDashboard.BankAccountsDistribution);
            summaryDistributions.AddRange(dashboard.AccountsGlobalDashboard.CashDistribution);

            summaryDistributions.AddRange(dashboard.BrokerAccountsGlobalDashboard.Distribution);
            summaryDistributions.AddRange(dashboard.CryptoAccountsGlobalDashboard.Distribution);
            summaryDistributions.AddRange(dashboard.DebtsGlobalDashboard.Distribution);
            summaryDistributions.AddRange(dashboard.DepositsGlobalDashboard.EarningsDistribution);
            summaryDistributions.AddRange(dashboard.DepositsGlobalDashboard.StartedAmountDistribution);

            foreach (var distribution in summaryDistributions)
            {
                if (totalCurrencies.ContainsKey(distribution.Currency))
                {
                    totalCurrencies[distribution.Currency] += distribution.Amount;
                }
                else
                {
                    totalCurrencies.Add(distribution.Currency, distribution.Amount);
                }
            }

            return totalCurrencies;
        }

        private async Task<IEnumerable<AccountDto>> GetCashAccounts()
        {
            return await _accountService.GetAllByTypesAsync(new[] { AccountTypeConstants.Cash }, true);
        }

        private void SetPercentValue(IXLCell cell, decimal value)
        {
            cell.Value = value;
            cell.Style.NumberFormat.Format = "0.00%";
        }

        private void SetFinanceValue(IXLCell cell, decimal value)
        {
            cell.Value = value;
            cell.Style.NumberFormat.Format = "#,##0.00";
        }
    }
}
