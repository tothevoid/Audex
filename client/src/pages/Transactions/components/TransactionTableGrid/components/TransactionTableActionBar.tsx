import React from 'react';
import { Button, HStack, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdCheckCircle, MdUndo } from 'react-icons/md';
import { ViewDisplayMode } from '../../TransactionFilterBar/TransactionFilterBar';
import TransactionsListHeader from '../../TransactionsListHeader/TransactionsListHeader';

interface TransactionTableActionBarProps {
    hasChanges: boolean;
    modifiedCount: number;
    addedCount: number;
    deletedCount: number;
    isSaving: boolean;
    onAddRow: () => void;
    onRefresh: () => void;
    onResetAll: () => void;
    onCommit: () => void;
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
}

export const TransactionTableActionBar: React.FC<TransactionTableActionBarProps> = ({
    hasChanges,
    modifiedCount,
    addedCount,
    deletedCount,
    isSaving,
    onAddRow,
    onRefresh,
    onResetAll,
    onCommit,
    viewDisplayMode,
    onViewDisplayModeChange,
}) => {
    const { t } = useTranslation();

    const leftExtra = (
        <Button
            size="sm"
            colorPalette="blue"
            onClick={onAddRow}
            px={3}
            borderRadius="lg"
        >
            <Icon mr={1}>
                <MdAdd size={18} />
            </Icon>
            {t('table_add_row')}
        </Button>
    );

    const rightExtra = hasChanges ? (
        <HStack gap={3}>
            <Text fontSize="xs" fontWeight={600} color="text_primary">
                💡 {t('table_changes_modified')}: {modifiedCount} • {t('table_changes_added')}: {addedCount} • {t('table_changes_deleted')}: {deletedCount}
            </Text>
            <Button
                size="sm"
                variant="ghost"
                color="text_secondary"
                onClick={onResetAll}
            >
                <Icon mr={1}>
                    <MdUndo />
                </Icon>
                {t('table_reset_changes')}
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
                {t('table_commit_changes')}
            </Button>
        </HStack>
    ) : undefined;

    return (
        <TransactionsListHeader
            viewDisplayMode={viewDisplayMode}
            onViewDisplayModeChange={onViewDisplayModeChange}
            onRefresh={onRefresh}
            leftExtra={leftExtra}
            rightExtra={rightExtra}
        />
    );
};

