import React, { useCallback } from 'react';
import { Box, Table } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { generateGuid } from '@/shared/utilities/idUtilities';
import { findEntityById } from '@/shared/utilities/arrayUtilities';
import { useEditableGrid } from '@/shared/hooks/useEditableGrid';
import { TransactionTableGridProps } from './types';
import {
    TransactionTableActionBar,
    TransactionTableRow,
} from './components';

export const TransactionTableGrid: React.FC<TransactionTableGridProps> = ({
    transactions,
    accounts,
    transactionTypes,
    selectedAccountId,
    onCommitDiff,
    onRefresh,
    viewDisplayMode,
    onViewDisplayModeChange,
}) => {
    const { t } = useTranslation();

    const createTransactionRow = useCallback((): TransactionEntity | null => {
        const defaultAccount = findEntityById(accounts, selectedAccountId, accounts[0]);
        const defaultType = transactionTypes[0];

        if (!defaultAccount || !defaultType) {
            return null;
        }

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
    }, [accounts, selectedAccountId, transactionTypes]);

    const cloneTransactionRow = useCallback(
        (sourceRow: TransactionEntity): TransactionEntity => ({
            ...sourceRow,
            id: generateGuid(),
            date: new Date(sourceRow.date),
        }),
        []
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
    } = useEditableGrid<TransactionEntity>({
        items: transactions,
        createRow: createTransactionRow,
        cloneRow: cloneTransactionRow,
        onCommit: onCommitDiff,
    });

    const handleCommit = useCallback(async () => {
        if (!hasChanges) {
            return;
        }

        await commit();
    }, [hasChanges, commit]);

    return (
        <Box>
            {/* Action Bar with controls and diff counters */}
            <TransactionTableActionBar
                hasChanges={hasChanges}
                modifiedCount={modifiedCount}
                addedCount={addedCount}
                deletedCount={deletedCount}
                isSaving={isSaving}
                onAddRow={handleAddRow}
                onRefresh={onRefresh}
                onResetAll={handleResetAll}
                onCommit={handleCommit}
                viewDisplayMode={viewDisplayMode}
                onViewDisplayModeChange={onViewDisplayModeChange}
            />

            {/* Interactive Spreadsheet Grid */}
            <Box
                overflowX="auto"
                bg="background_primary"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border_primary"
                boxShadow="sm"
            >
                <Table.Root size="sm" variant="line">
                    <Table.Header>
                        <Table.Row backgroundColor="background_secondary">
                            <Table.ColumnHeader color="text_secondary" fontSize="2xs" w="105px">
                                {t('entity_transaction_date')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="text_secondary" fontSize="2xs" w="160px">
                                {t('entity_transaction_name')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="text_secondary" fontSize="2xs" w="155px">
                                {t('entity_transaction_money_quantity')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="text_secondary" fontSize="2xs" w="120px">
                                {t('entity_transaction_cashback')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="text_secondary" fontSize="2xs" w="155px">
                                {t('entity_transaction_transaction_type')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader color="text_secondary" fontSize="2xs" w="180px">
                                {t('entity_transaction_account')}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right" color="text_secondary" fontSize="2xs" w="110px">
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
