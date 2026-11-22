import React, { useCallback, useMemo } from 'react';
import { Box, Table } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { generateGuid } from '@/shared/utilities/idUtilities';
import { findEntityById } from '@/shared/utilities/arrayUtilities';
import { EditableGridDiff, useEditableGrid } from '@/shared/hooks/useEditableGrid';
import { useAccounts } from '@/shared/hooks/queries/useAccounts';
import { EditableTransactionRow, isTransactionRowValid, TransactionTableGridProps } from './types';
import {
    TransactionTableActionBar,
    TransactionTableRow,
} from './components';

export const TransactionTableGrid: React.FC<TransactionTableGridProps> = ({
    transactions,
    transactionTypes,
    selectedAccountId,
    selectedCategoryId,
    onCommitDiff,
    onRefresh,
    isRefreshing = false,
    viewDisplayMode,
    onViewDisplayModeChange,
    isAnalyticsOpen,
    onToggleAnalytics,
}) => {
    const { t } = useTranslation();
    const { data: accounts = [] } = useAccounts();

    const createTransactionRow = useCallback((): EditableTransactionRow => {
        const defaultAccount = selectedAccountId
            ? findEntityById(accounts, selectedAccountId)
            : undefined;
        const defaultType = selectedCategoryId && selectedCategoryId !== 'none'
            ? findEntityById(transactionTypes, selectedCategoryId)
            : undefined;

        return {
            id: generateGuid(),
            name: '',
            amount: -100,
            cashback: 0,
            date: new Date(),
            account: defaultAccount,
            transactionType: defaultType,
            isSystem: false,
        };
    }, [accounts, selectedAccountId, transactionTypes, selectedCategoryId]);

    const cloneTransactionRow = useCallback(
        (sourceRow: EditableTransactionRow): EditableTransactionRow => ({
            ...sourceRow,
            id: generateGuid(),
            date: new Date(sourceRow.date),
        }),
        []
    );

    const handleCommitEditableDiff = useCallback(
        async (diff: EditableGridDiff<EditableTransactionRow>) => {
            const toTransactionEntity = (item: EditableTransactionRow): TransactionEntity => {
                if (!item.account || !item.transactionType || !item.name.trim() || item.amount === 0) {
                    throw new Error('Cannot commit invalid transaction row');
                }
                return {
                    ...item,
                    name: item.name.trim(),
                    account: item.account,
                    transactionType: item.transactionType,
                };
            };

            const commitDiff: EditableGridDiff<TransactionEntity> = {
                added: diff.added.map(toTransactionEntity),
                updated: diff.updated.map(toTransactionEntity),
                deletedIds: diff.deletedIds,
            };

            await onCommitDiff(commitDiff);
        },
        [onCommitDiff]
    );

    const {
        rows,
        isSaving,
        hasChanges,
        modifiedCount,
        addedCount,
        deletedCount,
        commit,
        handleRowChange,
        handleRowRevert,
        handleAddRow,
        handleDuplicateRow,
        handleDeleteRow,
        handleResetAll,
    } = useEditableGrid<EditableTransactionRow>({
        items: transactions,
        createRow: createTransactionRow,
        cloneRow: cloneTransactionRow,
        onCommit: handleCommitEditableDiff,
    });

    const hasInvalidRows = useMemo(() => {
        return rows.some(
            (gridItem) => !gridItem.isDeleted && !isTransactionRowValid(gridItem.row)
        );
    }, [rows]);

    const handleCommit = useCallback(async () => {
        if (!hasChanges || hasInvalidRows) {
            return;
        }

        await commit();
    }, [hasChanges, hasInvalidRows, commit]);

    return (
        <Box>
            {/* Table Action Bar */}
            <TransactionTableActionBar
                hasChanges={hasChanges}
                modifiedCount={modifiedCount}
                addedCount={addedCount}
                deletedCount={deletedCount}
                isSaving={isSaving}
                isCommitDisabled={hasInvalidRows}
                onAddRow={() => handleAddRow()}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                onResetAll={handleResetAll}
                onCommit={handleCommit}
                isAnalyticsOpen={isAnalyticsOpen}
                onToggleAnalytics={onToggleAnalytics}
                viewDisplayMode={viewDisplayMode}
                onViewDisplayModeChange={onViewDisplayModeChange}
            />

            {/* Interactive Spreadsheet Grid */}
            <Box
                overflowX="auto"
                overflowY="auto"
                maxH="calc(100vh - 280px)"
                bg="background_primary"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border_primary"
                boxShadow="sm"
            >
                <Table.Root size="sm" variant="line">
                    <Table.Header position="sticky" top={0} zIndex={2} bg="background_secondary">
                        <Table.Row backgroundColor="background_secondary">
                            <Table.ColumnHeader bg="background_secondary" color="text_secondary" fontSize="2xs" w="105px">
                                {t('entity_transaction_date')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader bg="background_secondary" color="text_secondary" fontSize="2xs" w="160px">
                                {t('entity_transaction_name')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader bg="background_secondary" color="text_secondary" fontSize="2xs" w="155px">
                                {t('entity_transaction_money_quantity')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader bg="background_secondary" color="text_secondary" fontSize="2xs" w="120px">
                                {t('entity_transaction_cashback')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader bg="background_secondary" color="text_secondary" fontSize="2xs" w="170px">
                                {t('entity_transaction_transaction_type')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader bg="background_secondary" color="text_secondary" fontSize="2xs" w="190px">
                                {t('entity_transaction_account')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader bg="background_secondary" textAlign="right" color="text_secondary" fontSize="2xs" w="110px">
                                {t('table_actions_header')}
                            </Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {rows.map(({ row, original, isAdded, isDeleted }) => (
                            <TransactionTableRow
                                key={row.id}
                                row={row}
                                original={original}
                                isAdded={isAdded}
                                isDeleted={isDeleted}
                                accounts={accounts}
                                transactionTypes={transactionTypes}
                                onRowChange={handleRowChange}
                                onRowRevert={handleRowRevert}
                                onDuplicateRow={handleDuplicateRow}
                                onDeleteRow={handleDeleteRow}
                            />
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>
    );
};

export default TransactionTableGrid;
