import "./TransactionsPage.scss";

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import TransactionSummaryHeader from './components/TransactionSummaryHeader/TransactionSummaryHeader';
import TransactionFilterBar, { TypeFilterMode, ViewDisplayMode } from './components/TransactionFilterBar/TransactionFilterBar';
import TransactionCardsView, { TransactionCardsActionBar } from './components/TransactionCardsView';
import TransactionTableGrid from './components/TransactionTableGrid/TransactionTableGrid';
import TransactionStats from './components/TransactionStats/TransactionStats';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from "@/models/transactions/TransactionEntity";
import { useTransactions } from "./hooks/useTransactions";
import NewTransactionModal from "./modals/NewTransactionModal/NewTransactionModal";
import { CurrencyTransactionEntity } from "@/models/transactions/CurrencyTransactionEntity";
import { useEntityModal } from "@/shared/hooks/useEntityModal";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";
import TransactionModal from "./modals/TransactionModal/TransactionModal";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import PageContainer from "@/shared/components/PageContainer/PageContainer";
import { createCurrencyTransaction } from "@/api/transactions/currencyTransactionApi";
import { createTransaction, updateTransaction, deleteTransaction } from "@/api/transactions/transactionApi";
import { EditableGridDiff } from "@/shared/hooks/useEditableGrid";
import { OutOfPeriodWarningModal } from "./components/TransactionTableGrid/components/OutOfPeriodWarningModal";
import { getOutOfPeriodItems, OutOfPeriodItem } from "./components/TransactionTableGrid/types";
import { useAccounts } from "@/shared/hooks/queries/useAccounts";

const STORAGE_KEY_TRANSACTIONS_ANALYTICS_OPEN = 'audex_transactions_analytics_open';
const STORAGE_KEY_TABLE_ANALYTICS_LEGACY = 'audex_transactions_table_analytics_open';

const TransactionsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { data: accounts = [] } = useAccounts();

    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(() => {
        try {
            const storedValue = localStorage.getItem(STORAGE_KEY_TRANSACTIONS_ANALYTICS_OPEN)
                ?? localStorage.getItem(STORAGE_KEY_TABLE_ANALYTICS_LEGACY);
            return storedValue !== null ? storedValue === 'true' : true;
        } catch {
            return true;
        }
    });

    const handleToggleAnalytics = useCallback(() => {
        setIsAnalyticsOpen((previousState) => {
            const nextState = !previousState;
            try {
                localStorage.setItem(STORAGE_KEY_TRANSACTIONS_ANALYTICS_OPEN, String(nextState));
                localStorage.setItem(STORAGE_KEY_TABLE_ANALYTICS_LEGACY, String(nextState));
            } catch {
                // Ignore storage write errors in restricted environments
            }
            return nextState;
        });
    }, []);
    const { confirmDelete } = useConfirm();

    // Display & Filtering states
    const [viewDisplayMode, setViewDisplayMode] = useState<ViewDisplayMode>(() => {
        return (localStorage.getItem('audex_transactions_view_mode') as ViewDisplayMode) || 'cards';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilterMode>('all');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [pendingTableDiff, setPendingTableDiff] = useState<EditableGridDiff<TransactionEntity> | null>(null);
    const [pendingOutOfPeriodItems, setPendingOutOfPeriodItems] = useState<OutOfPeriodItem[]>([]);
    const [isTableSaving, setIsTableSaving] = useState(false);
    const tableWarningModalRef = useRef<BaseModalRef>(null);

    const {
        activeEntity,
        modalRef,
        onEditClicked,
        mode,
        onActionEnded
    } = useEntityModal<TransactionEntity>();

    const {
        transactions,
        summary,
        createTransactionEntity,
        updateTransactionEntity,
        deleteTransactionEntity,
        refetch,
        setParams,
        params,
        isTransactionsLoading
    } = useTransactions({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), showSystem: false });

    const handleViewDisplayModeChange = useCallback((mode: ViewDisplayMode) => {
        setViewDisplayMode(mode);
        localStorage.setItem('audex_transactions_view_mode', mode);
    }, []);

    const onPageSwitched = useCallback((month: number | null, year: number) => {
        setParams((previousParams) => ({ ...previousParams, month, year }));
    }, [setParams]);

    const onShowSystemSwitched = useCallback((showSystem: boolean) => {
        setParams((previousParams) => ({ ...previousParams, showSystem }));
    }, [setParams]);

    const handleCategoryClick = useCallback((categoryId: string) => {
        setSelectedCategoryId((prev) => (prev === categoryId ? '' : categoryId));
    }, []);

    const handleAccountClick = useCallback((accountId: string) => {
        setSelectedAccountId((prev) => (prev === accountId ? '' : accountId));
    }, []);

    const handleDuplicateFromList = useCallback((transaction: TransactionEntity) => {
        // Open edit/create modal pre-populated with copied values (new id)
        onEditClicked({ ...transaction, id: '' });
    }, [onEditClicked]);

    // Base filtered transactions (by type, account, search) used for stats chart
    const statsTransactions = useMemo(() => {
        return transactions.filter((transactionItem) => {
            // Type filter
            if (typeFilter === 'income' && transactionItem.amount <= 0) return false;
            if (typeFilter === 'expense' && transactionItem.amount >= 0) return false;

            // Account filter
            if (selectedAccountId && transactionItem.account.id !== selectedAccountId) return false;

            // Search query filter (by transaction name)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                if (!transactionItem.name?.toLowerCase().includes(query)) return false;
            }

            return true;
        });
    }, [transactions, typeFilter, selectedAccountId, searchQuery]);

    // Further filtered by category for cards list and table view
    const filteredTransactions = useMemo(() => {
        if (!selectedCategoryId) return statsTransactions;

        return statsTransactions.filter((transactionItem) => {
            if (selectedCategoryId === 'none') {
                return !transactionItem.transactionType;
            }
            return transactionItem.transactionType?.id === selectedCategoryId;
        });
    }, [statsTransactions, selectedCategoryId]);

    const addTransactionModalRef = useRef<BaseModalRef>(null);

    const onAddTransactionClick = useCallback(() => {
        addTransactionModalRef.current?.openModal();
    }, []);

    const onCreateCurrencyTransaction = useCallback(async (currencyTransactionEntity: CurrencyTransactionEntity) => {
        await createCurrencyTransaction(currencyTransactionEntity);
    }, []);

    const onTransactionSaved = useCallback(async (transaction: TransactionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createTransactionEntity(transaction);
        } else {
            await updateTransactionEntity(transaction);
        }

        onActionEnded();
    }, [createTransactionEntity, mode, onActionEnded, updateTransactionEntity]);

    const onDeleteClicked = useCallback(async (transaction: TransactionEntity) => {
        const confirmed = await confirmDelete(t("transaction_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteTransactionEntity(transaction);
    }, [confirmDelete, deleteTransactionEntity, t]);

    const executeTableCommit = useCallback(async (diff: EditableGridDiff<TransactionEntity>) => {
        setIsTableSaving(true);
        try {
            await Promise.all([
                ...diff.added.map((addedItem) => createTransaction(addedItem)),
                ...diff.updated.map((updatedItem) => updateTransaction(updatedItem)),
                ...diff.deletedIds.map((deletedId) => deleteTransaction(deletedId)),
            ]);
            await refetch();
            tableWarningModalRef.current?.closeModal();
            setPendingTableDiff(null);
        } finally {
            setIsTableSaving(false);
        }
    }, [refetch]);

    const handleCommitTableDiff = useCallback(async (diff: EditableGridDiff<TransactionEntity>) => {
        const outOfPeriodItems = getOutOfPeriodItems(diff, params.month, params.year, i18n);

        if (outOfPeriodItems.length > 0) {
            setPendingTableDiff(diff);
            setPendingOutOfPeriodItems(outOfPeriodItems);
            tableWarningModalRef.current?.openModal();
            return;
        }

        await executeTableCommit(diff);
    }, [params.month, params.year, i18n, executeTableCommit]);

    return (
        <PageContainer color="text_primary">
            {/* Page Header */}
            <SectionHeader
                title={t("manager_transactions_title")}
                size="2xl"
                onAdd={onAddTransactionClick}
                addButtonTitle={t("manager_transactions_add_transaction")}
            />

            {/* Filter & Search Bar with Month Picker */}
            <TransactionFilterBar
                year={params.year}
                month={params.month}
                onPageSwitched={onPageSwitched}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                selectedAccountId={selectedAccountId}
                onAccountFilterChange={setSelectedAccountId}
                showSystem={params.showSystem}
                onShowSystemChange={onShowSystemSwitched}
                accounts={accounts}
            />

            {/* Monthly KPI Metrics Header (corresponds to selected month) */}
            <TransactionSummaryHeader summary={summary} />

            {/* Split Layout: Interactive View (Cards or Spreadsheet Grid) + Collapsible Analytics Sidebar */}
            <Grid
                templateColumns={isAnalyticsOpen ? { base: '1fr', xl: '7fr 3fr' } : '1fr'}
                gap={6}
                alignItems="start"
            >
                <GridItem minW={0}>
                    {/* MODE 1: CARDS VIEW MODE */}
                    {viewDisplayMode === 'cards' && (
                        <>
                            <TransactionCardsActionBar
                                viewDisplayMode={viewDisplayMode}
                                onViewDisplayModeChange={handleViewDisplayModeChange}
                                isAnalyticsOpen={isAnalyticsOpen}
                                onToggleAnalytics={handleToggleAnalytics}
                                onRefresh={refetch}
                                isRefreshing={isTransactionsLoading}
                                onAddTransaction={onAddTransactionClick}
                            />
                            <TransactionCardsView
                                transactions={filteredTransactions}
                                isLoading={isTransactionsLoading}
                                year={params.year}
                                month={params.month}
                                onEditClicked={onEditClicked}
                                onDeleteClicked={onDeleteClicked}
                                onDuplicateClicked={handleDuplicateFromList}
                            />
                        </>
                    )}

                    {/* MODE 2: UNIFIED INTERACTIVE SPREADSHEET TABLE MODE */}
                    {viewDisplayMode === 'table' && (
                        <TransactionTableGrid
                            transactions={filteredTransactions}
                            selectedAccountId={selectedAccountId}
                            selectedCategoryId={selectedCategoryId}
                            onCommitDiff={handleCommitTableDiff}
                            onRefresh={refetch}
                            isRefreshing={isTransactionsLoading || isTableSaving}
                            viewDisplayMode={viewDisplayMode}
                            onViewDisplayModeChange={handleViewDisplayModeChange}
                            isAnalyticsOpen={isAnalyticsOpen}
                            onToggleAnalytics={handleToggleAnalytics}
                        />
                    )}
                </GridItem>

                {/* Donut Analytics Sidebar */}
                {isAnalyticsOpen && (
                    <GridItem minW={0} position="sticky" top="84px">
                        <TransactionStats
                            accounts={accounts}
                            transactions={statsTransactions}
                            typeFilter={typeFilter}
                            selectedCategoryId={selectedCategoryId}
                            onCategoryClick={handleCategoryClick}
                            selectedAccountId={selectedAccountId}
                            onAccountClick={handleAccountClick}
                        />
                    </GridItem>
                )}
            </Grid>

            {/* Modals for edit & advanced creation */}
            <TransactionModal transaction={activeEntity} modalRef={modalRef} onSaved={onTransactionSaved} />
            <NewTransactionModal
                modalRef={addTransactionModalRef}
                onTransactionSaved={createTransactionEntity}
                onCurrencyTransactionSaved={onCreateCurrencyTransaction}
            />

            {/* Out of Period Warning Modal for Table Grid Mode */}
            <OutOfPeriodWarningModal
                ref={tableWarningModalRef}
                items={pendingOutOfPeriodItems}
                isSaving={isTableSaving}
                onConfirm={() => pendingTableDiff && executeTableCommit(pendingTableDiff)}
            />
        </PageContainer>
    );
};

export default TransactionsPage;
