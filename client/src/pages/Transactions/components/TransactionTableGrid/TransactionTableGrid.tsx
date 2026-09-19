import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Table } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { TransactionTypeEntity } from '../../../../models/transactions/TransactionTypeEntity';
import { generateGuid } from '../../../../shared/utilities/idUtilities';
import { BaseModalRef } from '../../../../shared/utilities/modalUtilities';
import {
    CommitDiffPayload,
    RowDiff,
    TransactionTableGridProps,
} from './types';
import {
    hasOutOfPeriodTransactions,
    OutOfMonthWarningModal,
    TransactionTableActionBar,
    TransactionTableRow,
} from './components';

export const TransactionTableGrid: React.FC<TransactionTableGridProps> = ({
    transactions,
    accounts,
    transactionTypes,
    selectedMonth,
    selectedYear,
    selectedAccountId,
    onCommitDiff,
    onRefresh,
}) => {
    const { t } = useTranslation();

    // Working copies for table editing
    const [rows, setRows] = useState<TransactionEntity[]>([]);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const [modifiedMap, setModifiedMap] = useState<Map<string, { row: TransactionEntity; diff: RowDiff }>>(new Map());

    const warningModalRef = useRef<BaseModalRef>(null);
    const [pendingDiff, setPendingDiff] = useState<CommitDiffPayload | null>(null);

    const originalMap = useMemo(() => {
        const map = new Map<string, TransactionEntity>();
        transactions.forEach((t) => map.set(t.id, { ...t, date: new Date(t.date) }));
        return map;
    }, [transactions]);

    // Reset all changes back to original
    const handleResetAll = useCallback(() => {
        setRows(transactions.map((t) => ({ ...t, date: new Date(t.date) })));
        setAddedIds(new Set());
        setDeletedIds(new Set());
        setModifiedMap(new Map());
    }, [transactions]);

    useEffect(() => {
        handleResetAll();
    }, [handleResetAll]);

    // Triggered when row values change and differ from original
    const handleRowChange = useCallback((id: string, updatedRow: TransactionEntity, diff: RowDiff) => {
        setRows((prev) => prev.map((r) => (r.id === id ? updatedRow : r)));
        if (!addedIds.has(id)) {
            setModifiedMap((prev) => new Map(prev).set(id, { row: updatedRow, diff }));
        }
    }, [addedIds]);

    // Triggered when row values are reverted back to match original
    const handleRowRevert = useCallback((id: string) => {
        if (addedIds.has(id)) {
            setRows((prevRows) => prevRows.filter((r) => r.id !== id));
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            return;
        }

        const orig = originalMap.get(id);
        if (orig) {
            setRows((prevRows) =>
                prevRows.map((r) => (r.id === id ? { ...orig, date: new Date(orig.date) } : r))
            );
        }

        setModifiedMap((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Map(prev);
            next.delete(id);
            return next;
        });

        setDeletedIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, [addedIds, originalMap]);

    // Add clean empty row
    const handleAddRow = useCallback(() => {
        const newId = generateGuid();
        const foundAcc = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) : null;
        const defaultAcc = foundAcc ?? accounts[0] ?? ({ id: '', name: '' } as AccountEntity);
        const defaultType = transactionTypes[0] ?? ({ id: '', name: '' } as TransactionTypeEntity);

        const newRow: TransactionEntity = {
            id: newId,
            name: '',
            amount: -100,
            cashback: 0,
            date: new Date(),
            account: defaultAcc,
            transactionType: defaultType,
            isSystem: false,
        };

        setRows((prev) => [newRow, ...prev]);
        setAddedIds((prev) => new Set(prev).add(newId));
    }, [accounts, selectedAccountId, transactionTypes]);

    // Duplicate row
    const handleDuplicateRow = useCallback((sourceRow: TransactionEntity) => {
        const newId = generateGuid();
        const copyRow: TransactionEntity = {
            ...sourceRow,
            id: newId,
            date: new Date(sourceRow.date),
        };

        setRows((prev) => [copyRow, ...prev]);
        setAddedIds((prev) => new Set(prev).add(newId));
    }, []);

    // Delete row (mark existing for deletion or remove added row)
    const handleDeleteRow = useCallback((id: string) => {
        if (addedIds.has(id)) {
            setRows((prevRows) => prevRows.filter((r) => r.id !== id));
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            return;
        }

        setDeletedIds((prev) => new Set(prev).add(id));
    }, [addedIds]);


    const modifiedCount = modifiedMap.size;
    const addedCount = addedIds.size;
    const deletedCount = deletedIds.size;
    const hasChanges = modifiedCount > 0 || addedCount > 0 || deletedCount > 0;

    const executeCommit = async (diffToCommit: CommitDiffPayload) => {
        setIsSaving(true);
        try {
            await onCommitDiff(diffToCommit);
            warningModalRef.current?.closeModal();
            setPendingDiff(null);
        } finally {
            setIsSaving(false);
        }
    };

    // Commit diff
    const handleCommit = async () => {
        if (!hasChanges) return;

        const addedList = rows.filter((r) => addedIds.has(r.id));

        const updatedList = Array.from(modifiedMap.values())
            .filter((v) => !deletedIds.has(v.row.id))
            .map((v) => v.row);

        const diff: CommitDiffPayload = {
            added: addedList,
            updated: updatedList,
            deletedIds: Array.from(deletedIds),
        };

        // Check if any added/updated transaction has a date outside selectedMonth/selectedYear
        if (hasOutOfPeriodTransactions(diff, selectedMonth, selectedYear)) {
            setPendingDiff(diff);
            warningModalRef.current?.openModal();
            return;
        }

        await executeCommit(diff);
    };

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
                        {rows.map((row) => (
                            <TransactionTableRow
                                key={row.id}
                                row={row}
                                original={originalMap.get(row.id)}
                                isAdded={addedIds.has(row.id)}
                                isDeleted={deletedIds.has(row.id)}
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

            {/* Out of Month Warning Modal */}
            <OutOfMonthWarningModal
                ref={warningModalRef}
                diff={pendingDiff}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                isSaving={isSaving}
                onConfirm={() => pendingDiff && executeCommit(pendingDiff)}
            />
        </Box>
    );
};

export default TransactionTableGrid;
