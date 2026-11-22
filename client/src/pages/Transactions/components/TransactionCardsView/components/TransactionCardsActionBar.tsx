import React from 'react';
import { Flex, HStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ViewDisplayMode } from '@/pages/Transactions/components/TransactionFilterBar/TransactionFilterBar';
import TransactionViewModeSwitcher from '@/pages/Transactions/components/TransactionViewModeSwitcher/TransactionViewModeSwitcher';
import AddButton from '@/shared/components/AddButton';
import RefreshButton from '@/shared/components/RefreshButton';
import AnalyticsButton from '@/shared/components/AnalyticsButton';
import FilterBlock from '@/shared/components/FilterBlock';

export interface TransactionCardsActionBarProps {
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
    isAnalyticsOpen: boolean;
    onToggleAnalytics: () => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
    onAddTransaction: () => void;
}

export const TransactionCardsActionBar: React.FC<TransactionCardsActionBarProps> = ({
    viewDisplayMode,
    onViewDisplayModeChange,
    isAnalyticsOpen,
    onToggleAnalytics,
    onRefresh,
    isRefreshing = false,
    onAddTransaction,
}) => {
    const { t } = useTranslation();

    return (
        <FilterBlock mb={4}>
            <Flex
                justify="space-between"
                align="center"
                w="100%"
                flexWrap="wrap"
                gap={3}
            >
                {/* Left Controls: Add Transaction + Analytics Toggle + Refresh */}
                <HStack gap={2}>
                    <AddButton
                        size="sm"
                        buttonTitle={t('manager_transactions_add_transaction')}
                        onClick={() => onAddTransaction()}
                        borderRadius="lg"
                    />

                    <AnalyticsButton
                        isOpen={isAnalyticsOpen}
                        onToggle={onToggleAnalytics}
                        title={isAnalyticsOpen ? t('table_hide_analytics') : t('table_show_analytics')}
                    />

                    <RefreshButton
                        isRefreshing={isRefreshing}
                        onClick={onRefresh}
                    />
                </HStack>

                {/* Right Controls: View Mode Switcher */}
                <HStack gap={3}>
                    <TransactionViewModeSwitcher
                        viewDisplayMode={viewDisplayMode}
                        onViewDisplayModeChange={onViewDisplayModeChange}
                    />
                </HStack>
            </Flex>
        </FilterBlock>
    );
};

export default TransactionCardsActionBar;
