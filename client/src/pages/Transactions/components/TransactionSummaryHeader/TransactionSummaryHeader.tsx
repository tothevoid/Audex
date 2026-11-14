import React from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdCalendarToday, MdSavings } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { TransactionSummary } from '@/models/transactions/TransactionSummary';
import { useUserProfile } from '@/features/UserProfileSettingsModal/hooks/UserProfileContext';
import MoneyCard from '@/shared/components/MoneyCard/MoneyCard';

interface Props {
    summary: TransactionSummary | null;
}

export const TransactionSummaryHeader: React.FC<Props> = ({ summary }) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const currencyName = summary?.currencyName || user?.currency.name;

    const totalIncome = summary?.totalIncome ?? 0;
    const totalExpenses = summary?.totalExpenses ?? 0;
    const totalCashback = summary?.totalCashback ?? 0;
    const netExpenses = summary?.netExpenses ?? 0;
    const netBalance = summary?.netBalance ?? 0;
    const dailyAverageExpense = summary?.dailyAverageExpense ?? 0;

    return (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} gap={4} mb={6}>
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
                subtitle={totalCashback > 0 ? `${t('summary_net_expenses')}: ${netExpenses.toLocaleString()} ${currencyName || ''}` : undefined}
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
                value={dailyAverageExpense}
                currency={currencyName}
                color="text_primary"
                icon={<MdCalendarToday size={20} />}
                iconBg="background_secondary"
                iconColor="text_secondary"
            />
            <MoneyCard
                title={t('summary_total_cashback')}
                value={totalCashback}
                currency={currencyName}
                color="gain"
                icon={<MdSavings size={20} />}
                iconBg="status_success_bg"
                iconColor="gain"
            />
        </SimpleGrid>
    );
};

export default TransactionSummaryHeader;
