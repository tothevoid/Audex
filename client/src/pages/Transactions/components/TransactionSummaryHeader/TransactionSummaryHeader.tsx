import React from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdCalendarToday } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { useUserProfile } from '../../../../features/UserProfileSettingsModal/hooks/UserProfileContext';
import MoneyCard from '../../../../shared/components/MoneyCard/MoneyCard';

interface Props {
    transactions: TransactionEntity[];
    daysInMonth?: number;
}

export const TransactionSummaryHeader: React.FC<Props> = ({ transactions, daysInMonth = 30 }) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const currencyName = user?.currency.name;

    // Calculate income, expense, net balance in user's rate
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
        const rate = t.account.currency.rate || 1;
        const converted = t.amount * rate;
        if (t.amount > 0) {
            totalIncome += converted;
        } else {
            totalExpenses += Math.abs(converted);
        }
    });

    const netBalance = totalIncome - totalExpenses;
    const dailyAvgExpense = daysInMonth > 0 ? totalExpenses / daysInMonth : 0;

    return (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
            <MoneyCard
                title={t('summary_total_income')}
                value={totalIncome}
                currency={currencyName}
                color="gain"
                icon={<MdTrendingUp size={22} />}
                iconBg="status_success_bg"
                iconColor="gain"
            />
            <MoneyCard
                title={t('summary_total_expenses')}
                value={totalExpenses}
                currency={currencyName}
                color="loss"
                icon={<MdTrendingDown size={22} />}
                iconBg="status_danger_bg"
                iconColor="loss"
            />
            <MoneyCard
                title={t('summary_net_balance')}
                value={netBalance}
                currency={currencyName}
                color={netBalance >= 0 ? 'gain' : 'loss'}
                prefix={netBalance >= 0 ? '+' : ''}
                icon={<MdAccountBalanceWallet size={22} />}
                iconBg="background_secondary"
                iconColor="text_primary"
            />
            <MoneyCard
                title={t('summary_daily_avg')}
                value={dailyAvgExpense}
                currency={currencyName}
                color="text_primary"
                icon={<MdCalendarToday size={20} />}
                iconBg="background_secondary"
                iconColor="text_secondary"
            />
        </SimpleGrid>
    );
};

export default TransactionSummaryHeader;
