using System.Collections.Generic;
using Riok.Mapperly.Abstractions;
using Audex.Application.DTO;
using Audex.Application.DTO.Accounts;
using Audex.Application.DTO.Banks;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Currencies;
using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Debts;
using Audex.Application.DTO.Deposits;
using Audex.Application.DTO.Notifications;
using Audex.Application.DTO.Securities;
using Audex.Application.DTO.Transactions;
using Audex.Application.DTO.User;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Entities.Banks;
using Audex.Infrastructure.Entities.Brokers;
using Audex.Infrastructure.Entities.Crypto;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Infrastructure.Entities.Debts;
using Audex.Infrastructure.Entities.Deposits;
using Audex.Infrastructure.Entities.Notifications;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Infrastructure.Entities.User;

namespace Audex.Application.Mappings
{
    [Mapper(RequiredMappingStrategy = RequiredMappingStrategy.None)]
    public partial class ApplicationMapper
    {
        public partial Transaction Map(TransactionDto dto);
        public partial TransactionDto Map(Transaction entity);
        public partial IEnumerable<TransactionDto> Map(IEnumerable<Transaction> entities);

        public partial Account Map(AccountDto dto);
        public partial AccountDto Map(Account entity);
        public partial IEnumerable<AccountDto> Map(IEnumerable<Account> entities);

        public partial TransactionType Map(TransactionTypeDto dto);
        public partial TransactionTypeDto Map(TransactionType entity);
        public partial IEnumerable<TransactionTypeDto> Map(IEnumerable<TransactionType> entities);

        public partial Deposit Map(DepositDto dto);
        public partial DepositDto Map(Deposit entity);
        public partial IEnumerable<DepositDto> Map(IEnumerable<Deposit> entities);

        public partial Currency Map(CurrencyDto dto);
        public partial CurrencyDto Map(Currency entity);
        public partial IEnumerable<CurrencyDto> Map(IEnumerable<Currency> entities);

        public partial AccountType Map(AccountTypeDto dto);
        public partial AccountTypeDto Map(AccountType entity);
        public partial IEnumerable<AccountTypeDto> Map(IEnumerable<AccountType> entities);

        [MapperIgnoreTarget(nameof(CurrencyTransaction.SourceAccount))]
        [MapperIgnoreTarget(nameof(CurrencyTransaction.DestinationAccount))]
        public partial CurrencyTransaction Map(CurrencyTransactionDto dto);
        public partial CurrencyTransactionDto Map(CurrencyTransaction entity);
        public partial IEnumerable<CurrencyTransactionDto> Map(IEnumerable<CurrencyTransaction> entities);

        public partial Security Map(SecurityDto dto);
        public partial SecurityDto Map(Security entity);
        public partial IEnumerable<SecurityDto> Map(IEnumerable<Security> entities);

        [MapperIgnoreTarget(nameof(Security.Id))]
        [MapperIgnoreTarget(nameof(Security.IconKey))]
        public partial void Update(SecurityDto dto, Security entity);

        public partial SecurityType Map(SecurityTypeDto dto);
        public partial SecurityTypeDto Map(SecurityType entity);
        public partial IEnumerable<SecurityTypeDto> Map(IEnumerable<SecurityType> entities);

        public partial Dividend Map(DividendDto dto);
        public partial DividendDto Map(Dividend entity);
        public partial IEnumerable<DividendDto> Map(IEnumerable<Dividend> entities);

        public partial Broker Map(BrokerDto dto);
        public partial BrokerDto Map(Broker entity);
        public partial IEnumerable<BrokerDto> Map(IEnumerable<Broker> entities);

        public partial BrokerAccount Map(BrokerAccountDto dto);
        public partial BrokerAccountDto Map(BrokerAccount entity);
        public partial IEnumerable<BrokerAccountDto> Map(IEnumerable<BrokerAccount> entities);

        public partial BrokerAccountSecurity Map(BrokerAccountSecurityDto dto);
        public partial BrokerAccountSecurityDto Map(BrokerAccountSecurity entity);
        public partial IEnumerable<BrokerAccountSecurityDto> Map(IEnumerable<BrokerAccountSecurity> entities);

        public partial BrokerAccountType Map(BrokerAccountTypeDto dto);
        public partial BrokerAccountTypeDto Map(BrokerAccountType entity);
        public partial IEnumerable<BrokerAccountTypeDto> Map(IEnumerable<BrokerAccountType> entities);

        public partial SecurityTransaction Map(SecurityTransactionDto dto);
        public partial SecurityTransactionDto Map(SecurityTransaction entity);
        public partial IEnumerable<SecurityTransactionDto> Map(IEnumerable<SecurityTransaction> entities);

        public partial UserProfile Map(UserProfileDto dto);
        public partial UserProfileDto Map(UserProfile entity);

        [MapperIgnoreTarget(nameof(Debt.DebtTags))]
        public partial Debt Map(DebtDto dto);
        public partial DebtDto Map(Debt entity);
        public partial IEnumerable<DebtDto> Map(IEnumerable<Debt> entities);

        public partial DebtTag Map(DebtTagDto dto);
        public partial DebtTagDto Map(DebtTag entity);
        public partial IEnumerable<DebtTagDto> Map(IEnumerable<DebtTag> entities);

        public DebtTagDto Map(DebtToDebtTag source) => source.DebtTag == null ? null! : Map(source.DebtTag);

        public partial DebtPayment Map(DebtPaymentDto dto);
        public partial DebtPaymentDto Map(DebtPayment entity);
        public partial IEnumerable<DebtPaymentDto> Map(IEnumerable<DebtPayment> entities);

        public partial DividendPayment Map(DividendPaymentDto dto);
        public partial DividendPaymentDto Map(DividendPayment entity);
        public partial IEnumerable<DividendPaymentDto> Map(IEnumerable<DividendPayment> entities);

        public partial CryptoAccountCryptocurrency Map(CryptoAccountCryptocurrencyDto dto);
        public partial CryptoAccountCryptocurrencyDto Map(CryptoAccountCryptocurrency entity);
        public partial IEnumerable<CryptoAccountCryptocurrencyDto> Map(IEnumerable<CryptoAccountCryptocurrency> entities);

        public partial CryptoAccount Map(CryptoAccountDto dto);
        public partial CryptoAccountDto Map(CryptoAccount entity);
        public partial IEnumerable<CryptoAccountDto> Map(IEnumerable<CryptoAccount> entities);

        public partial Cryptocurrency Map(CryptocurrencyDto dto);
        public partial CryptocurrencyDto Map(Cryptocurrency entity);
        public partial IEnumerable<CryptocurrencyDto> Map(IEnumerable<Cryptocurrency> entities);

        public partial CryptoProvider Map(CryptoProviderDto dto);
        public partial CryptoProviderDto Map(CryptoProvider entity);
        public partial IEnumerable<CryptoProviderDto> Map(IEnumerable<CryptoProvider> entities);

        public partial BrokerAccountFundsTransfer Map(BrokerAccountFundsTransferDto dto);
        public partial BrokerAccountFundsTransferDto Map(BrokerAccountFundsTransfer entity);
        public partial IEnumerable<BrokerAccountFundsTransferDto> Map(IEnumerable<BrokerAccountFundsTransfer> entities);

        public partial Bank Map(BankDto dto);
        public partial BankDto Map(Bank entity);
        public partial IEnumerable<BankDto> Map(IEnumerable<Bank> entities);

        public partial BrokerAccountTaxDeduction Map(BrokerAccountTaxDeductionDto dto);
        public partial BrokerAccountTaxDeductionDto Map(BrokerAccountTaxDeduction entity);
        public partial IEnumerable<BrokerAccountTaxDeductionDto> Map(IEnumerable<BrokerAccountTaxDeduction> entities);

        public partial Notification Map(NotificationDto dto);
        public partial NotificationDto Map(Notification entity);
        public partial IEnumerable<NotificationDto> Map(IEnumerable<Notification> entities);
    }
}
