#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Dashboard;
using Audex.Application.DTO.Dashboard.Widgets;
using Audex.Application.DTO.Deposits;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Dashboard;
using Audex.Application.Interfaces.Debts;
using Audex.Application.Interfaces.Deposits;
using Audex.Application.Interfaces.Integrations.Indices;
using Audex.Application.Interfaces.Integrations.Oil;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Interfaces.User;
using Audex.Application.Utilities.Dashboard;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.User;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Dashboard
{
    public class DashboardWidgetsService : IDashboardWidgetsService
    {
        private readonly IRepository<UserDashboard> _userDashboardRepository;
        private readonly IOilConnector _oilConnector;
        private readonly IIndicesConnector _indicesConnector;
        private readonly IAccountService _accountService;
        private readonly IBrokerAccountService _brokerAccountService;
        private readonly IBrokerAccountSummaryService _brokerAccountSummaryService;
        private readonly IDepositService _depositService;
        private readonly IDebtService _debtService;
        private readonly ICryptoAccountService _cryptoAccountService;
        private readonly ICryptoAccountCryptocurrencyService _cryptoAccountCryptocurrencyService;
        private readonly ICurrencyService _currencyService;
        private readonly IBankService _bankService;
        private readonly ITransactionsService _transactionsService;
        private readonly IUserProfileService _userProfileService;
        private readonly ILocalizationService _localizationService;

        public DashboardWidgetsService(
            IUnitOfWork unitOfWork,
            IOilConnector oilConnector,
            IIndicesConnector indicesConnector,
            IAccountService accountService,
            IBrokerAccountService brokerAccountService,
            IBrokerAccountSummaryService brokerAccountSummaryService,
            IDepositService depositService,
            IDebtService debtService,
            ICryptoAccountService cryptoAccountService,
            ICryptoAccountCryptocurrencyService cryptoAccountCryptocurrencyService,
            ICurrencyService currencyService,
            IBankService bankService,
            ITransactionsService transactionsService,
            IUserProfileService userProfileService,
            ILocalizationService localizationService)
        {
            _userDashboardRepository = unitOfWork.CreateRepository<UserDashboard>();
            _oilConnector = oilConnector;
            _indicesConnector = indicesConnector;
            _accountService = accountService;
            _brokerAccountService = brokerAccountService;
            _brokerAccountSummaryService = brokerAccountSummaryService;
            _depositService = depositService;
            _debtService = debtService;
            _cryptoAccountService = cryptoAccountService;
            _cryptoAccountCryptocurrencyService = cryptoAccountCryptocurrencyService;
            _currencyService = currencyService;
            _bankService = bankService;
            _transactionsService = transactionsService;
            _userProfileService = userProfileService;
            _localizationService = localizationService;
        }

        public async Task<OilWidgetDto> GetOilWidgetAsync(Guid userId, OilWidgetRequestDto request)
        {
            var targetSymbols = request.Symbols.Count > 0
                ? request.Symbols
                : (await GetWidgetSettingsAsync<OilWidgetSettingsDto>(userId, request.DashboardId, request.WidgetId))?.Symbols;

            var quotes = (await _oilConnector.GetOilQuotesAsync(targetSymbols)).ToList();

            return new OilWidgetDto
            {
                Quotes = quotes
            };
        }

        public Task<IReadOnlyList<string>> GetSupportedOilSymbolsAsync()
        {
            return _oilConnector.GetSupportedSymbolsAsync();
        }

        public async Task<IndicesWidgetDto> GetIndicesWidgetAsync(Guid userId, IndicesWidgetRequestDto request)
        {
            var targetCodes = request.Codes.Count > 0
                ? request.Codes
                : (await GetWidgetSettingsAsync<IndicesWidgetSettingsDto>(userId, request.DashboardId, request.WidgetId))?.Codes;

            var quotes = (await _indicesConnector.GetIndicesQuotesAsync(targetCodes)).ToList();

            return new IndicesWidgetDto
            {
                Indices = quotes
            };
        }

        public Task<IReadOnlyList<string>> GetSupportedIndicesAsync()
        {
            return _indicesConnector.GetSupportedIndicesAsync();
        }

        public async Task<DistributionWidgetDataDto> GetTotalBalanceWidgetDataAsync()
        {
            var userProfile = await _userProfileService.GetAsync();
            var currencyName = userProfile?.Currency?.Name ?? string.Empty;
            var userLanguage = await _localizationService.GetUserLanguageAsync();

            var cashData = await GetCashDistributionWidgetDataAsync();
            var securitiesData = await GetSecuritiesDistributionWidgetDataAsync();
            var depositsData = await GetDepositsDistributionWidgetDataAsync();
            var depositIncomesData = await GetDepositIncomesDistributionWidgetDataAsync();
            var bankAccountsData = await GetBankAccountsDistributionWidgetDataAsync();
            var debtsData = await GetDebtsDistributionWidgetDataAsync();
            var cryptoData = await GetCryptoDistributionWidgetDataAsync();

            var totals = new List<DistributionDto>();

            if (cashData.Total is > 0)
            {
                var cashTotal = cashData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceCash, userLanguage),
                    Currency = currencyName,
                    Amount = cashTotal,
                    ConvertedAmount = cashTotal
                });
            }

            if (securitiesData.Total is > 0)
            {
                var securitiesTotal = securitiesData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceSecurities, userLanguage),
                    Currency = currencyName,
                    Amount = securitiesTotal,
                    ConvertedAmount = securitiesTotal
                });
            }

            if (depositsData.Total is > 0)
            {
                var depositsTotal = depositsData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceDeposits, userLanguage),
                    Currency = currencyName,
                    Amount = depositsTotal,
                    ConvertedAmount = depositsTotal
                });
            }

            if (depositIncomesData.Total is > 0)
            {
                var depositIncomesTotal = depositIncomesData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceDepositIncomes, userLanguage),
                    Currency = currencyName,
                    Amount = depositIncomesTotal,
                    ConvertedAmount = depositIncomesTotal
                });
            }

            if (bankAccountsData.Total is > 0)
            {
                var bankAccountsTotal = bankAccountsData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceBankAccounts, userLanguage),
                    Currency = currencyName,
                    Amount = bankAccountsTotal,
                    ConvertedAmount = bankAccountsTotal
                });
            }

            if (debtsData.Total is > 0)
            {
                var debtsTotal = debtsData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceDebts, userLanguage),
                    Currency = currencyName,
                    Amount = debtsTotal,
                    ConvertedAmount = debtsTotal
                });
            }

            if (cryptoData.Total is > 0)
            {
                var cryptoTotal = cryptoData.Total.Value;
                totals.Add(new DistributionDto
                {
                    Name = _localizationService.Get(LocalizationKeys.Dashboard.TotalBalanceCrypto, userLanguage),
                    Currency = currencyName,
                    Amount = cryptoTotal,
                    ConvertedAmount = cryptoTotal
                });
            }

            var overallTotal = totals.Sum(distributionItem => distributionItem.ConvertedAmount);

            return new DistributionWidgetDataDto
            {
                Total = overallTotal,
                Distribution = totals
            };
        }

        public async Task<DistributionWidgetDataDto> GetCashDistributionWidgetDataAsync()
        {
            var accounts = await _accountService.GetAllAsync(true);
            var cashAccounts = accounts
                .Where(account => account.AccountTypeId == AccountTypeConstants.Cash)
                .ToList();

            var distributions = cashAccounts.Select(account => new DistributionDto
            {
                Name = account.Name,
                Currency = account.Currency.Name,
                Amount = account.Balance,
                ConvertedAmount = account.Balance * account.Currency.Rate
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = distributions.Sum(distributionItem => distributionItem.ConvertedAmount),
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetBankAccountsDistributionWidgetDataAsync()
        {
            var accounts = await _accountService.GetAllAsync(true);
            var bankAccounts = accounts
                .Where(account => account.AccountTypeId == AccountTypeConstants.DebitCard ||
                                  account.AccountTypeId == AccountTypeConstants.CreditCard)
                .ToList();

            var distributions = bankAccounts.Select(account => new DistributionDto
            {
                Name = account.Name,
                Currency = account.Currency.Name,
                Amount = account.Balance,
                ConvertedAmount = account.Balance * account.Currency.Rate
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = distributions.Sum(distributionItem => distributionItem.ConvertedAmount),
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetSecuritiesDistributionWidgetDataAsync()
        {
            var brokerAccounts = await _brokerAccountService.GetAllAsync();
            var distributions = new List<DistributionDto>();
            decimal totalSecurities = 0;

            foreach (var brokerAccount in brokerAccounts)
            {
                var currencyName = brokerAccount.Currency.Name;
                var portfolioValues = await _brokerAccountSummaryService.GetPortfolioValuesByBrokerAccountAsync(brokerAccount.Id);
                var amount = portfolioValues.CurrentAmount;
                var convertedAmount = amount * brokerAccount.Currency.Rate;

                totalSecurities += convertedAmount;
                distributions.Add(new DistributionDto
                {
                    Name = brokerAccount.Name,
                    Currency = currencyName,
                    Amount = amount,
                    ConvertedAmount = convertedAmount
                });
            }

            return new DistributionWidgetDataDto
            {
                Total = totalSecurities,
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetDepositsDistributionWidgetDataAsync()
        {
            var deposits = await _depositService.GetAllActiveAsync();
            var distributions = deposits.Select(deposit =>
            {
                var startedAmount = deposit.InitialAmount;
                var convertedStartedAmount = startedAmount * deposit.Currency.Rate;

                return new DistributionDto
                {
                    Name = deposit.Name,
                    Currency = deposit.Currency.Name,
                    Amount = startedAmount,
                    ConvertedAmount = convertedStartedAmount
                };
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = distributions.Sum(distributionItem => distributionItem.ConvertedAmount),
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetDepositIncomesDistributionWidgetDataAsync()
        {
            var deposits = await _depositService.GetAllActiveAsync();
            var distributions = deposits.Select(deposit =>
            {
                var earnedAmount = CalculateDepositEarnings(deposit);
                var convertedEarnedAmount = earnedAmount * deposit.Currency.Rate;

                return new DistributionDto
                {
                    Name = deposit.Name,
                    Currency = deposit.Currency.Name,
                    Amount = earnedAmount,
                    ConvertedAmount = convertedEarnedAmount
                };
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = distributions.Sum(distributionItem => distributionItem.ConvertedAmount),
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetDebtsDistributionWidgetDataAsync()
        {
            var debts = await _debtService.GetAllAsync(true);
            var distributions = debts.Select(debt => new DistributionDto
            {
                Name = debt.Name,
                Currency = debt.Currency.Name,
                Amount = debt.Amount,
                ConvertedAmount = debt.Amount * debt.Currency.Rate
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = distributions.Sum(distributionItem => distributionItem.ConvertedAmount),
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetCryptoDistributionWidgetDataAsync()
        {
            var cryptoAccounts = await _cryptoAccountService.GetAllAsync();
            var currencies = await _currencyService.GetAllAsync();
            var usdCurrency = currencies.FirstOrDefault(currency => currency.Id == CurrencyConstants.USD);
            var usdRate = usdCurrency?.Rate ?? 1;
            var usdCurrencyName = usdCurrency?.Name ?? "USD";

            var distributions = new List<DistributionDto>();
            decimal totalCrypto = 0;

            foreach (var cryptoAccount in cryptoAccounts)
            {
                var balance = await _cryptoAccountCryptocurrencyService.GetTotalBalanceByCryptoAccountAsync(cryptoAccount.Id);
                if (balance <= 0)
                {
                    continue;
                }

                var convertedAmount = balance * usdRate;
                totalCrypto += convertedAmount;

                distributions.Add(new DistributionDto
                {
                    Name = cryptoAccount.Name,
                    Currency = usdCurrencyName,
                    Amount = balance,
                    ConvertedAmount = convertedAmount
                });
            }

            return new DistributionWidgetDataDto
            {
                Total = totalCrypto,
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetBanksDistributionWidgetDataAsync()
        {
            var banks = (await _bankService.GetAllAsync())
                .ToDictionary(bank => bank.Id, bank => bank);

            var distributions = new Dictionary<string, DistributionDto>();

            void AddBankDistribution(Guid? bankId, string currencyName, decimal amount, decimal convertedAmount)
            {
                if (bankId == null || !banks.TryGetValue(bankId.Value, out var bank))
                {
                    return;
                }

                var key = $"{bank.Name} ({currencyName})";
                if (distributions.TryGetValue(key, out var existingDistribution))
                {
                    existingDistribution.Amount += amount;
                    existingDistribution.ConvertedAmount += convertedAmount;
                }
                else
                {
                    distributions.Add(key, new DistributionDto
                    {
                        Name = bank.Name,
                        Currency = currencyName,
                        Amount = amount,
                        ConvertedAmount = convertedAmount
                    });
                }
            }

            var accounts = await _accountService.GetAllAsync(true);
            foreach (var account in accounts)
            {
                if (account.AccountTypeId == AccountTypeConstants.Cash ||
                    account.AccountTypeId == AccountTypeConstants.DebitCard ||
                    account.AccountTypeId == AccountTypeConstants.CreditCard)
                {
                    var currencyName = account.Currency.Name;
                    var amount = account.Balance;
                    var convertedAmount = amount * account.Currency.Rate;
                    AddBankDistribution(account.BankId, currencyName, amount, convertedAmount);
                }
            }

            var brokerAccounts = await _brokerAccountService.GetAllAsync();
            foreach (var brokerAccount in brokerAccounts)
            {
                var currencyName = brokerAccount.Currency.Name;
                var portfolioValues = await _brokerAccountSummaryService.GetPortfolioValuesByBrokerAccountAsync(brokerAccount.Id);
                var amount = portfolioValues.CurrentAmount;
                var convertedAmount = amount * brokerAccount.Currency.Rate;
                AddBankDistribution(brokerAccount.BankId, currencyName, amount, convertedAmount);
            }

            var deposits = await _depositService.GetAllActiveAsync();
            foreach (var deposit in deposits)
            {
                var currencyName = deposit.Currency.Name;
                var startedAmount = deposit.InitialAmount;
                var convertedStartedAmount = startedAmount * deposit.Currency.Rate;
                var earnedAmount = CalculateDepositEarnings(deposit);
                var convertedEarnedAmount = earnedAmount * deposit.Currency.Rate;

                AddBankDistribution(
                    deposit.BankId,
                    currencyName,
                    startedAmount + earnedAmount,
                    convertedStartedAmount + convertedEarnedAmount);
            }

            var distributionList = distributions.Values.ToList();

            return new DistributionWidgetDataDto
            {
                Total = distributionList.Sum(distributionItem => distributionItem.ConvertedAmount),
                Distribution = distributionList
            };
        }

        public async Task<DistributionWidgetDataDto> GetSpentsDistributionWidgetDataAsync()
        {
            var userProfile = await _userProfileService.GetAsync();
            var currencyName = userProfile?.Currency?.Name ?? string.Empty;
            var currentDate = DateTime.Now;

            var transactions = (await _transactionsService.GetAllAsync(currentDate.Month, currentDate.Year, false))
                .Where(transaction => !transaction.IsSystem);

            var spents = new Dictionary<string, decimal>();
            decimal spentsTotal = 0;

            foreach (var transaction in transactions)
            {
                if (transaction.Amount <= 0)
                {
                    var typeName = transaction.TransactionType.Name;
                    var amount = Math.Abs(transaction.Amount);
                    var convertedAmount = amount * transaction.Account.Currency.Rate;

                    spentsTotal += convertedAmount;
                    if (spents.ContainsKey(typeName))
                    {
                        spents[typeName] += convertedAmount;
                    }
                    else
                    {
                        spents.Add(typeName, convertedAmount);
                    }
                }
            }

            var distributions = spents.Select(spentItem => new DistributionDto
            {
                Name = spentItem.Key,
                Currency = currencyName,
                Amount = spentItem.Value,
                ConvertedAmount = spentItem.Value
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = spentsTotal,
                Distribution = distributions
            };
        }

        public async Task<DistributionWidgetDataDto> GetIncomesDistributionWidgetDataAsync()
        {
            var userProfile = await _userProfileService.GetAsync();
            var currencyName = userProfile?.Currency?.Name ?? string.Empty;
            var currentDate = DateTime.Now;

            var transactions = (await _transactionsService.GetAllAsync(currentDate.Month, currentDate.Year, false))
                .Where(transaction => !transaction.IsSystem);

            var incomes = new Dictionary<string, decimal>();
            decimal incomesTotal = 0;

            foreach (var transaction in transactions)
            {
                if (transaction.Amount > 0)
                {
                    var typeName = transaction.TransactionType.Name;
                    var amount = Math.Abs(transaction.Amount);
                    var convertedAmount = amount * transaction.Account.Currency.Rate;

                    incomesTotal += convertedAmount;
                    if (incomes.ContainsKey(typeName))
                    {
                        incomes[typeName] += convertedAmount;
                    }
                    else
                    {
                        incomes.Add(typeName, convertedAmount);
                    }
                }
            }

            var distributions = incomes.Select(incomeItem => new DistributionDto
            {
                Name = incomeItem.Key,
                Currency = currencyName,
                Amount = incomeItem.Value,
                ConvertedAmount = incomeItem.Value
            }).ToList();

            return new DistributionWidgetDataDto
            {
                Total = incomesTotal,
                Distribution = distributions
            };
        }

        private static decimal CalculateDepositEarnings(DepositDto deposit)
        {
            var totalDays = deposit.To.DayNumber - deposit.From.DayNumber;
            if (totalDays <= 0)
            {
                return 0;
            }

            var daysPassed = DateOnly.FromDateTime(DateTime.Now).DayNumber - deposit.From.DayNumber;
            return deposit.EstimatedEarn / totalDays * daysPassed;
        }

        private async Task<TSettings?> GetWidgetSettingsAsync<TSettings>(Guid userId, Guid dashboardId, string widgetId)
            where TSettings : class
        {
            if (dashboardId == Guid.Empty || string.IsNullOrWhiteSpace(widgetId))
            {
                return null;
            }

            var dashboardEntity = await _userDashboardRepository.GetByIdAsync(dashboardId, disableTracking: true);
            if (dashboardEntity == null || dashboardEntity.UserProfileId != userId || string.IsNullOrWhiteSpace(dashboardEntity.LayoutJson))
            {
                return null;
            }

            return DashboardLayoutValidator.ExtractWidgetSettings<TSettings>(dashboardEntity.LayoutJson, widgetId);
        }
    }
}
