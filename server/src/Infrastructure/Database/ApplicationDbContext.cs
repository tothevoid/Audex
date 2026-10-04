using Microsoft.EntityFrameworkCore;
using Audex.Infrastructure.Configurations.Accounts;
using Audex.Infrastructure.Configurations.Banks;
using Audex.Infrastructure.Configurations.Brokers;
using Audex.Infrastructure.Configurations.Currencies;
using Audex.Infrastructure.Configurations.Debts;
using Audex.Infrastructure.Configurations.Deposits;
using Audex.Infrastructure.Configurations.Notifications;
using Audex.Infrastructure.Configurations.Securities;
using Audex.Infrastructure.Configurations.Transactions;
using Audex.Infrastructure.Configurations.Scheduler;
using Audex.Infrastructure.Configurations.User;
using Audex.Infrastructure.Data;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Entities.Transactions;
using Audex.Infrastructure.Entities.User;
using AccountConfiguration = Audex.Infrastructure.Configurations.Accounts.AccountConfiguration;

namespace Audex.Infrastructure.Database
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            #if DEBUG
            optionsBuilder.EnableSensitiveDataLogging();
            #endif
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new AccountConfiguration());
            modelBuilder.ApplyConfiguration(new AccountTypeConfiguration());
            modelBuilder.ApplyConfiguration(new BrokerConfiguration());
            modelBuilder.ApplyConfiguration(new BrokerAccountFundsTransferConfiguration());
            modelBuilder.ApplyConfiguration(new BrokerAccountConfiguration());
            modelBuilder.ApplyConfiguration(new BrokerAccountSecurityConfiguration());
            modelBuilder.ApplyConfiguration(new BrokerAccountTypeConfiguration());
            modelBuilder.ApplyConfiguration(new CurrencyConfiguration());
            modelBuilder.ApplyConfiguration(new DepositConfiguration());
            modelBuilder.ApplyConfiguration(new SecurityConfiguration());
            modelBuilder.ApplyConfiguration(new SecurityTransactionConfiguration());
            modelBuilder.ApplyConfiguration(new SecurityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new DividendConfiguration());
            modelBuilder.ApplyConfiguration(new TransactionConfiguration());
            modelBuilder.ApplyConfiguration(new TransactionTypeConfiguration());
            modelBuilder.ApplyConfiguration(new UserProfileConfiguration());
            modelBuilder.ApplyConfiguration(new UserDashboardConfiguration());
            modelBuilder.ApplyConfiguration(new UserRefreshTokenConfiguration());
            modelBuilder.ApplyConfiguration(new DebtConfiguration());
            modelBuilder.ApplyConfiguration(new DebtTagConfiguration());
            modelBuilder.ApplyConfiguration(new DebtToDebtTagConfiguration());
            modelBuilder.ApplyConfiguration(new DebtPaymentConfiguration());
            modelBuilder.ApplyConfiguration(new DividendPaymentConfiguration());

            modelBuilder.ApplyConfiguration(new CryptoAccountConfiguration());
            modelBuilder.ApplyConfiguration(new CryptoAccountCryptocurrencyConfiguration());
            modelBuilder.ApplyConfiguration(new CryptocurrencyConfiguration());
            modelBuilder.ApplyConfiguration(new CryptoProviderConfiguration());
            
            modelBuilder.ApplyConfiguration(new CurrencyTransactionConfiguration());

            modelBuilder.ApplyConfiguration(new BankConfiguration());
            modelBuilder.ApplyConfiguration(new NotificationConfiguration());
            modelBuilder.ApplyConfiguration(new ScheduledCronTickerConfiguration());
            modelBuilder.ApplyConfiguration(new ScheduledTaskAttachmentConfiguration());

            InitializeDefaultData(modelBuilder);

            base.OnModelCreating(modelBuilder);
        }

        private void InitializeDefaultData(ModelBuilder builder)
        {
            builder.Entity<Currency>().HasData(new CurrencyGenerator().Generate());
            builder.Entity<AccountType>().HasData(new AccountTypeGenerator().Generate());
            builder.Entity<SecurityType>().HasData(new SecurityTypeGenerator().Generate());
            builder.Entity<TransactionType>().HasData(new TransactionTypeGenerator().Generate());
            builder.Entity<UserProfile>().HasData(new UserProfileGenerator().Generate());
        }
    }
}
