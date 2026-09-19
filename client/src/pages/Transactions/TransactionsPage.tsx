import "./TransactionsPage.scss";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Icon } from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import { AccountEntity } from '../../models/accounts/AccountEntity';
import TransactionSummaryHeader from './components/TransactionSummaryHeader/TransactionSummaryHeader';
import TransactionsListHeader from './components/TransactionsListHeader/TransactionsListHeader';
import TransactionFilterBar, { TypeFilterMode, ViewDisplayMode } from './components/TransactionFilterBar/TransactionFilterBar';
import TransactionCardsView from './components/TransactionCardsView';
import TransactionTableGrid from './components/TransactionTableGrid/TransactionTableGrid';
import { getAccountsByTypes } from '../../api/accounts/accountApi';
import { getTransactionTypes } from '../../api/transactions/transactionTypeApi';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from "../../models/transactions/TransactionEntity";
import { TransactionTypeEntity } from "../../models/transactions/TransactionTypeEntity";
import { useTransactions } from "./hooks/useTransactions";
import NewTransactionModal from "./modals/NewTransactionModal/NewTransactionModal";
import { CurrencyTransactionEntity } from "../../models/transactions/CurrencyTransactionEntity";
import { useEntityModal } from "../../shared/hooks/useEntityModal";
import { ActiveEntityMode } from "../../shared/enums/activeEntityMode";
import { ConfirmModal } from "../../shared/modals/ConfirmModal/ConfirmModal";
import TransactionModal from "./modals/TransactionModal/TransactionModal";
import SectionHeader from "../../shared/components/SectionHeader/SectionHeader";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";
import { ACCOUNT_TYPE } from "../../shared/constants/accountType";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import { createCurrencyTransaction } from "../../api/transactions/currencyTransactionApi";
import { createTransaction, updateTransaction, deleteTransaction } from "../../api/transactions/transactionApi";

interface State {
    accounts: AccountEntity[];
    transactionTypes: TransactionTypeEntity[];
}

const TransactionsPage: React.FC = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<State>({ accounts: [], transactionTypes: [] });

    // Display & Filtering states
    const [viewDisplayMode, setViewDisplayMode] = useState<ViewDisplayMode>(() => {
        return (localStorage.getItem('audex_transactions_view_mode') as ViewDisplayMode) || 'cards';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilterMode>('all');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    const {
        activeEntity,
        modalRef,
        confirmModalRef,
        onEditClicked,
        onDeleteClicked,
        mode,
        onActionEnded
    } = useEntityModal<TransactionEntity>();

    const {
        transactions,
        createTransactionEntity,
        updateTransactionEntity,
        deleteTransactionEntity,
        refetch,
        setParams,
        params,
        isTransactionsLoading
    } = useTransactions({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), showSystem: false });

    useEffect(() => {
        const initData = async () => {
            await initAccountsAndTypes();
        };
        initData();
    }, []);

    const initAccountsAndTypes = async () => {
        const accounts = await getAccountsByTypes([
            ACCOUNT_TYPE.CASH,
            ACCOUNT_TYPE.DEBIT_CARD,
            ACCOUNT_TYPE.CREDIT_CARD
        ], true);
        const transactionTypes = await getTransactionTypes(true);
        setState({ accounts, transactionTypes });
    };

    const handleViewDisplayModeChange = (mode: ViewDisplayMode) => {
        setViewDisplayMode(mode);
        localStorage.setItem('audex_transactions_view_mode', mode);
    };

    const onPageSwitched = (month: number, year: number) => {
        setParams({ month, year, showSystem: params.showSystem });
    };

    const onShowSystemSwitched = (showSystem: boolean) => {
        setParams({ ...params, showSystem });
    };

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategoryId((prev) => (prev === categoryId ? '' : categoryId));
    };

    const handleAccountClick = (accountId: string) => {
        setSelectedAccountId((prev) => (prev === accountId ? '' : accountId));
    };

    const handleDuplicateFromList = (transaction: TransactionEntity) => {
        // Open edit/create modal pre-populated with copied values (new id)
        onEditClicked({ ...transaction, id: '' });
    };

    // Base filtered transactions (by type, account, search) used for stats chart
    const statsTransactions = useMemo(() => {
        return transactions.filter((t) => {
            // Type filter
            if (typeFilter === 'income' && t.amount <= 0) return false;
            if (typeFilter === 'expense' && t.amount >= 0) return false;

            // Account filter
            if (selectedAccountId && t.account.id !== selectedAccountId) return false;

            // Search query filter (by transaction name)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                if (!t.name?.toLowerCase().includes(query)) return false;
            }

            return true;
        });
    }, [transactions, typeFilter, selectedAccountId, searchQuery]);

    // Further filtered by category for cards list and table view
    const filteredTransactions = useMemo(() => {
        if (!selectedCategoryId) return statsTransactions;

        return statsTransactions.filter((t) => {
            if (selectedCategoryId === 'none') {
                return !t.transactionType;
            }
            return t.transactionType?.id === selectedCategoryId;
        });
    }, [statsTransactions, selectedCategoryId]);

    const addTransactionModalRef = useRef<BaseModalRef>(null);

    const onAddTransactionClick = () => {
        addTransactionModalRef.current?.openModal();
    };

    const onCreateCurrencyTransaction = async (currencyTransactionEntity: CurrencyTransactionEntity) => {
        await createCurrencyTransaction(currencyTransactionEntity);
    };

    const onTransactionSaved = async (transaction: TransactionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createTransactionEntity(transaction);
        } else {
            await updateTransactionEntity(transaction);
        }

        onActionEnded();
    };

    const onDeleteConfirmed = async () => {
        if (!activeEntity) {
            throw new Error("Deleted entity is not set");
        }

        await deleteTransactionEntity(activeEntity);
        onActionEnded();
    };

    // Batch Commit handler for Table Grid Mode
    const handleCommitTableDiff = async (diff: {
        added: TransactionEntity[];
        updated: TransactionEntity[];
        deletedIds: string[];
    }) => {
        await Promise.all([
            ...diff.added.map((addedItem) => createTransaction(addedItem)),
            ...diff.updated.map((updatedItem) => updateTransaction(updatedItem)),
            ...diff.deletedIds.map((deletedId) => deleteTransaction(deletedId)),
        ]);
        await refetch();
    };

    const daysInMonth = new Date(params.year, params.month, 0).getDate();

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
                accounts={state.accounts}
            />

            {/* Monthly KPI Metrics Header (corresponds to selected month) */}
            <TransactionSummaryHeader transactions={transactions} daysInMonth={daysInMonth} />

            {/* View Action Bar (Always visible: Refresh + View Switcher) */}
            {viewDisplayMode === 'cards' && (
                <TransactionsListHeader
                    viewDisplayMode={viewDisplayMode}
                    onViewDisplayModeChange={handleViewDisplayModeChange}
                    onRefresh={refetch}
                    leftExtra={
                        <Button
                            size="sm"
                            colorPalette="blue"
                            onClick={onAddTransactionClick}
                            px={3}
                            borderRadius="lg"
                        >
                            <Icon mr={1}>
                                <MdAdd size={18} />
                            </Icon>
                            {t('manager_transactions_add_transaction')}
                        </Button>
                    }
                />
            )}

            {/* MODE 1: CARDS VIEW MODE */}
            {viewDisplayMode === 'cards' && (
                <TransactionCardsView
                    transactions={filteredTransactions}
                    statsTransactions={statsTransactions}
                    accounts={state.accounts}
                    isLoading={isTransactionsLoading}
                    year={params.year}
                    month={params.month}
                    typeFilter={typeFilter}
                    selectedCategoryId={selectedCategoryId}
                    onCategoryClick={handleCategoryClick}
                    selectedAccountId={selectedAccountId}
                    onAccountClick={handleAccountClick}
                    onEditClicked={onEditClicked}
                    onDeleteClicked={onDeleteClicked}
                    onDuplicateClicked={handleDuplicateFromList}
                />
            )}

            {/* MODE 2: UNIFIED INTERACTIVE SPREADSHEET TABLE MODE */}
            {viewDisplayMode === 'table' && (
                <TransactionTableGrid
                    transactions={filteredTransactions}
                    accounts={state.accounts}
                    transactionTypes={state.transactionTypes}
                    selectedMonth={params.month}
                    selectedYear={params.year}
                    selectedAccountId={selectedAccountId}
                    onCommitDiff={handleCommitTableDiff}
                    onRefresh={refetch}
                    viewDisplayMode={viewDisplayMode}
                    onViewDisplayModeChange={handleViewDisplayModeChange}
                />
            )}

            {/* Modals for edit & advanced creation */}
            <ConfirmModal
                onConfirmed={onDeleteConfirmed}
                title={t("transaction_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
            <TransactionModal transaction={activeEntity} modalRef={modalRef} onSaved={onTransactionSaved} />
            <NewTransactionModal
                modalRef={addTransactionModalRef}
                onTransactionSaved={createTransactionEntity}
                onCurrencyTransactionSaved={onCreateCurrencyTransaction}
            />
        </PageContainer>
    );
};

export default TransactionsPage;