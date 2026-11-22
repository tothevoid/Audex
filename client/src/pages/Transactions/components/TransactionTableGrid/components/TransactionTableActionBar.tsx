import React from 'react';
import { Button, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdCheckCircle, MdUndo } from 'react-icons/md';
import { ViewDisplayMode } from '@/pages/Transactions/components/TransactionFilterBar/TransactionFilterBar';
import TransactionViewModeSwitcher from '@/pages/Transactions/components/TransactionViewModeSwitcher/TransactionViewModeSwitcher';
import AddButton from '@/shared/components/AddButton';
import RefreshButton from '@/shared/components/RefreshButton';
import AnalyticsButton from '@/shared/components/AnalyticsButton';
import FilterBlock from '@/shared/components/FilterBlock';

export interface TransactionTableActionBarProps {
    hasChanges: boolean;
    modifiedCount: number;
    addedCount: number;
    deletedCount: number;
    isSaving: boolean;
    isRefreshing?: boolean;
    onAddRow: () => void;
    onRefresh: () => void;
    onResetAll: () => void;
    onCommit: () => void;
    isAnalyticsOpen?: boolean;
    onToggleAnalytics?: () => void;
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
}

export const TransactionTableActionBar: React.FC<TransactionTableActionBarProps> = ({
    hasChanges,
    modifiedCount,
    addedCount,
    deletedCount,
    isSaving,
    isRefreshing = false,
    onAddRow,
    onRefresh,
    onResetAll,
    onCommit,
    isAnalyticsOpen = true,
    onToggleAnalytics,
    viewDisplayMode,
    onViewDisplayModeChange,
}) => {
    const { t } = useTranslation();
    const totalChangesCount = modifiedCount + addedCount + deletedCount;

    return (
        <>
            {/* Primary Table Navigation Bar */}
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
                            onClick={onAddRow}
                            borderRadius="lg"
                        />

                        {onToggleAnalytics && (
                            <AnalyticsButton
                                isOpen={isAnalyticsOpen}
                                onToggle={onToggleAnalytics}
                                title={isAnalyticsOpen ? t('table_hide_analytics') : t('table_show_analytics')}
                            />
                        )}

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

            {/* Separate Changes Action Block (Appears only when edits/additions/deletions exist) */}
            {hasChanges && (
                <FilterBlock mb={4}>
                    <Flex
                        justify="space-between"
                        align="center"
                        w="100%"
                        flexWrap="wrap"
                        gap={3}
                    >
                        <Text fontSize="xs" fontWeight={600} color="text_primary">
                            💡 {t('table_changes_modified')}: {modifiedCount} • {t('table_changes_added')}: {addedCount} • {t('table_changes_deleted')}: {deletedCount}
                        </Text>

                        <HStack gap={2}>
                            <Button
                                size="sm"
                                variant="ghost"
                                color="text_secondary"
                                onClick={onResetAll}
                            >
                                <Icon mr={1}>
                                    <MdUndo />
                                </Icon>
                                {t('table_reset_changes')} ({totalChangesCount})
                            </Button>
                            <Button
                                size="sm"
                                colorPalette="green"
                                loading={isSaving}
                                onClick={onCommit}
                                px={4}
                                borderRadius="lg"
                            >
                                <Icon mr={1}>
                                    <MdCheckCircle />
                                </Icon>
                                {t('table_commit_changes')} ({totalChangesCount})
                            </Button>
                        </HStack>
                    </Flex>
                </FilterBlock>
            )}
        </>
    );
};

export default TransactionTableActionBar;
