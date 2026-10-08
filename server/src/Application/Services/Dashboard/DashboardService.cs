using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Dashboard;
using Audex.Application.DTO.Deposits;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Accounts;
using Audex.Application.Interfaces.Banks;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Dashboard;
using Audex.Application.Interfaces.Debts;
using Audex.Application.Interfaces.Deposits;
using Audex.Application.Interfaces.Transactions;
using Audex.Application.Interfaces.User;
using Audex.Application.Services.Brokers;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Interfaces.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Audex.Application.Services.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _db;
        private readonly IAccountService _accountService;
        private readonly IDepositService _depositService;
        private readonly ITransactionsService _transactionsService;
        private readonly IBrokerAccountService _brokerAccountService;
        private readonly IDebtService _debtService;
        private readonly IUserProfileService _userProfile;
        private readonly ICryptoAccountService _cryptoAccountService;
        private readonly ICurrencyService _currencyService;
        private readonly ICryptoAccountCryptocurrencyService _cryptoAccountCryptocurrencyService;
        private readonly IBankService _bankService;
        private readonly IBrokerAccountSummaryService _brokerAccountSummaryService;

        public DashboardService(IUnitOfWork uow, IAccountService accountService, 
            IDepositService depositService, ITransactionsService transactionsService,
            IBrokerAccountService brokerAccountService, IDebtService debtService, 
            IUserProfileService userProfile, ICryptoAccountService cryptoAccountService, 
            ICurrencyService currencyService, ICryptoAccountCryptocurrencyService cryptoAccountCryptocurrencyService,
            IBankService bankService, IBrokerAccountSummaryService brokerAccountSummaryService)
        {
            _db = uow;
            _accountService = accountService;
            _depositService = depositService;
            _transactionsService = transactionsService;
            _brokerAccountService = brokerAccountService;
            _debtService = debtService;
            _userProfile = userProfile;
            _cryptoAccountService = cryptoAccountService;
            _currencyService = currencyService;
            _cryptoAccountCryptocurrencyService = cryptoAccountCryptocurrencyService;
            _bankService = bankService;
            _brokerAccountSummaryService = brokerAccountSummaryService;
        }

        public async Task<GlobalDashboardDto> GetDashboardAsync()
        {
            var banks = await _bankService.GetAllAsync();
            var bankDistributionCalculator = new BankDistributionCalculator(banks);

            var accountStats = await GetAccountData(bankDistributionCalculator);
            var brokerAccountStats = await GetBrokerAccountData(bankDistributionCalculator);
            var debtsStats = await GetDebtsData();
            var depositStats = await GetDepositStats(bankDistributionCalculator);
            var cryptoAccountStats = await GetCryptoAccountStats();

            return new GlobalDashboardDto()
            {
                //TODO: make it via setters
                Total = accountStats.Total + brokerAccountStats.Total + debtsStats.Total + depositStats.Total + cryptoAccountStats.Total,
                AccountsGlobalDashboard = accountStats,
                BrokerAccountsGlobalDashboard = brokerAccountStats,
                DebtsGlobalDashboard = debtsStats,
                DepositsGlobalDashboard = depositStats,
                TransactionsGlobalDashboard = await GetTransactionDate(),
                CryptoAccountsGlobalDashboard = cryptoAccountStats,
                BanksGlobalDashboard = new BanksGlobalDashboardDto() {Distribution = bankDistributionCalculator.GetDistribution() }
            };
        }

        private async Task<TransactionsGlobalDashboardDto> GetTransactionDate()
        {
            var userProfile = await _userProfile.GetAsync();

            var currentDate = DateTime.Now;
            var transactions = (await _transactionsService
                .GetAllAsync(currentDate.Month, currentDate.Year, false))
                //TODO: migrate to db level
                .Where(transaction => !transaction.IsSystem);

            var spents = new Dictionary<string, decimal>();
            var incomes = new Dictionary<string, decimal>();

            decimal spentsTotal = 0;
            decimal incomesTotal = 0;

            foreach (var transaction in transactions) 
            {
                if (transaction.Amount > 0)
                {
                    incomesTotal += HandleTransaction(transaction, incomes);
                }
                else
                {
                    spentsTotal += HandleTransaction(transaction, spents);
                }
            }

            return new TransactionsGlobalDashboardDto()
            {
                SpentsTotal = spentsTotal,
                IncomesTotal = incomesTotal,
                SpentsDistribution = GetTransactionsDistribution(userProfile.Currency.Name, spents),
                IncomesDistribution = GetTransactionsDistribution(userProfile.Currency.Name, incomes)
            };
        }

        private IEnumerable<DistributionDto> GetTransactionsDistribution(string currencyName, 
            Dictionary<string, decimal> transactionTypesDistribution)
        {
            return transactionTypesDistribution
                .Select(spent => new DistributionDto()
                {
                    Name = spent.Key,
                    Currency = currencyName,
                    Amount = spent.Value,
                    ConvertedAmount = spent.Value
                });
        }

        private decimal HandleTransaction(TransactionDto transaction, Dictionary<string, decimal> distribution)
        {
            var typeName = transaction.TransactionType.Name;
            var amount = Math.Abs(transaction.Amount);
            var convertedAmount = amount * transaction.Account.Currency.Rate;

            if (distribution.ContainsKey(typeName))
            {
                distribution[typeName] += convertedAmount;
            }
            else
            {
                distribution.Add(typeName, convertedAmount);
            }

            return convertedAmount;
        }

        private async Task<AccountsGlobalDashboardDto> GetAccountData(BankDistributionCalculator bankDistributionCalculator)
        {
            var accounts = await _accountService.GetAllAsync(true);

            var cashValuesDistribution = new List<DistributionDto>();
            var bankAccountsDistribution = new List<DistributionDto>();

            decimal cashSummary = 0;
            decimal bankAccountSummary = 0;

            foreach (var account in accounts)
            {
                if (account.AccountTypeId == AccountTypeConstants.Cash)
                {
                    cashSummary += HandleCard(account, cashValuesDistribution, bankDistributionCalculator);
                }
                else if (account.AccountTypeId == AccountTypeConstants.DebitCard ||
                         account.AccountTypeId == AccountTypeConstants.CreditCard)
                {
                    bankAccountSummary += HandleCard(account, bankAccountsDistribution, bankDistributionCalculator);
                }
            }

            return new AccountsGlobalDashboardDto()
            {
                Total = cashSummary + bankAccountSummary,

                TotalCash = cashSummary,
                TotalBankAccount = bankAccountSummary,

                CashDistribution = cashValuesDistribution,
                BankAccountsDistribution = bankAccountsDistribution
            };
        }

        private decimal HandleCard(AccountDto account, List<DistributionDto> cardValues, 
            BankDistributionCalculator bankDistributionCalculator)
        {
            var currencyName = account.Currency.Name;
            var amount = account.Balance;
            var convertedAmount = account.Balance * account.Currency.Rate;

            cardValues.Add(new DistributionDto()
            {
                Name = account.Name,
                Currency = currencyName,
                Amount = account.Balance,
                ConvertedAmount = convertedAmount
            });

            bankDistributionCalculator.Add(account.BankId, currencyName, amount, convertedAmount);

            return convertedAmount;
        }

        private async Task<BrokerAccountsGlobalDashboardDto> GetBrokerAccountData(BankDistributionCalculator bankDistributionCalculator)
        {
            var brokerAccounts = await _brokerAccountService.GetAllAsync();

            var brokerAccountsValues = new List<DistributionDto>();
            decimal brokerAccountsSummary = 0;

            foreach (var brokerAccount in brokerAccounts)
            {
                var currencyName = brokerAccount.Currency.Name;

                var values = await _brokerAccountSummaryService.GetPortfolioValuesByBrokerAccountAsync(brokerAccount.Id);

                var amount = values.CurrentAmount;

                var convertedAmount = amount * brokerAccount.Currency.Rate;
                brokerAccountsSummary += convertedAmount;

                brokerAccountsValues.Add(new DistributionDto()
                {
                    Name = brokerAccount.Name,
                    Currency = currencyName,
                    Amount = amount,
                    ConvertedAmount = convertedAmount
                });

                bankDistributionCalculator.Add(brokerAccount.BankId, currencyName, amount, convertedAmount);
            }

            return new BrokerAccountsGlobalDashboardDto()
            {
                Total = brokerAccountsSummary,
                Distribution = brokerAccountsValues
            };
        }

        private async Task<DebtsGlobalDashboardDto> GetDebtsData()
        {
            var debts = await _debtService.GetAllAsync(true);

            var debtsDistribution = new List<DistributionDto>();
            decimal debtsSummary = 0;

            foreach (var debt in debts)
            {
                var currencyName = debt.Currency.Name;
                var convertedAmount = debt.Amount * debt.Currency.Rate;
                debtsSummary += convertedAmount;

                debtsDistribution.Add(new DistributionDto()
                {
                    Name = debt.Name,
                    Currency = currencyName,
                    Amount = debt.Amount,
                    ConvertedAmount = convertedAmount
                });
            }

            return new DebtsGlobalDashboardDto()
            {
                Total = debtsSummary,
                Distribution = debtsDistribution
            };
        }

        private async Task<DepositsGlobalDashboardDto> GetDepositStats(BankDistributionCalculator bankDistributionCalculator)
        {
            var deposits = await _depositService.GetAllActiveAsync();

            var startedAmountDistribution = new List<DistributionDto>();
            var earningsDistribution = new List<DistributionDto>();

            decimal totalStartedAmount = 0;
            decimal totalEarned = 0;
            
            foreach (var deposit in deposits)
            {
                var key = deposit.Name;

                var currencyName = deposit.Currency.Name;

                var startedAmount = deposit.InitialAmount;
                var convertedStartedAmount = startedAmount * deposit.Currency.Rate;

                var earnedAmount = CalculateDepositEarnings(deposit);
                var convertedEarnedAmount = earnedAmount * deposit.Currency.Rate;

                totalStartedAmount += convertedStartedAmount;
                totalEarned += convertedEarnedAmount;

                startedAmountDistribution.Add(new DistributionDto()
                {
                    Name = key,
                    Currency = currencyName,
                    Amount = startedAmount,
                    ConvertedAmount = convertedStartedAmount
                });

                earningsDistribution.Add(new DistributionDto()
                {
                    Name = key,
                    Currency = currencyName,
                    Amount = earnedAmount,
                    ConvertedAmount = convertedEarnedAmount
                });

                bankDistributionCalculator.Add(deposit.BankId, currencyName, 
                    startedAmount + earnedAmount, 
                    convertedStartedAmount + convertedEarnedAmount);
            }

            return new DepositsGlobalDashboardDto()
            {
                Total = totalStartedAmount + totalEarned,

                TotalStartedAmount = totalStartedAmount,
                StartedAmountDistribution = startedAmountDistribution,

                TotalEarned = totalEarned,
                EarningsDistribution = earningsDistribution
            };

        }

        private decimal CalculateDepositEarnings(DepositDto deposit)
        {
            var totalDays = deposit.To.DayNumber - deposit.From.DayNumber;
            var daysPassed = DateOnly.FromDateTime(DateTime.Now).DayNumber - deposit.From.DayNumber;
            return deposit.EstimatedEarn / totalDays * daysPassed;
        }

        private async Task<CryptoAccountsGlobalDashboardDto> GetCryptoAccountStats()
        {
            var cryptoAccounts = await _cryptoAccountService.GetAllAsync();

            // TODO: Rework
            var currencies = await _currencyService.GetAllAsync();
            var usdCurrency = currencies.FirstOrDefault(currency => currency.Id == CurrencyConstants.USD);

            var cryptoAccountsValues = new List<DistributionDto>();
            decimal brokerAccountsSummary = 0;

            foreach (var cryptoAccount in cryptoAccounts)
            {
                var amount = await _cryptoAccountCryptocurrencyService
                    .GetTotalBalanceByCryptoAccountAsync(cryptoAccount.Id);

                if (amount <= 0)
                {
                    continue;
                }

                var key = cryptoAccount.Name;
                var convertedAmount = amount * usdCurrency.Rate;
                brokerAccountsSummary += convertedAmount;

                cryptoAccountsValues.Add(new DistributionDto()
                {
                    Name = cryptoAccount.Name,
                    Currency = usdCurrency.Name,
                    Amount = amount,
                    ConvertedAmount = convertedAmount
                });
            }

            return new CryptoAccountsGlobalDashboardDto()
            {
                Total = brokerAccountsSummary,
                Distribution = cryptoAccountsValues
            };
        }
    }

    class BankDistributionCalculator
    {
        private Dictionary<string, DistributionDto> Distributions { get; } = new();

        private Dictionary<Guid, BankDto> Banks { get; }

        public BankDistributionCalculator(IEnumerable<BankDto> banks)
        {
            Banks = banks.ToDictionary(key => key.Id, value => value);
        }

        public void Add(Guid? bankId, string currencyName, decimal amount, decimal convertedAmount)
        {
            if (bankId == null || !Banks.ContainsKey((Guid)bankId))
            {
                return;
            }

            var bank = Banks[(Guid)bankId];
            var key = $"{bank.Name} ({currencyName})";

            if (Distributions.ContainsKey(key))
            {
                var distribution = Distributions[key];
                distribution.Amount += amount;
                distribution.ConvertedAmount += convertedAmount;
            }
            else
            {
                Distributions.Add(key, new DistributionDto()
                {
                    Name = bank.Name,
                    Currency = currencyName,
                    Amount = amount,
                    ConvertedAmount = convertedAmount
                });
            }
        }

        public IEnumerable<DistributionDto> GetDistribution()
        {
            return Distributions.Values;
        }
    }
}

