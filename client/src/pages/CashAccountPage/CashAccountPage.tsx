import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Stack } from "@chakra-ui/react";
import { getAccountById } from "../../api/accounts/accountApi";
import { createCurrencyTransaction, deleteCurrencyTransaction, getCurrencyAccountSummary, getCurrencyTransactionsByAccountId, getCurrencyTransactionsPagination, updateCurrencyTransaction } from "../../api/transactions/currencyTransactionApi";
import { CurrencyTransactionEntity } from "../../models/transactions/CurrencyTransactionEntity";
import { useTranslation } from "react-i18next";
import { getCurrenciesMap } from "../../api/currencies/currencyApi";
import { AccountEntity } from "../../models/accounts/AccountEntity";
import { useUserProfile } from "../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import CurrencyTransactionModal from "../Transactions/modals/CurrencyTransactionModal/CurrencyTransactionModal";
import { ConfirmModal } from "../../shared/modals/ConfirmModal/ConfirmModal";
import { useEntityModal } from "../../shared/hooks/useEntityModal";
import { ActiveEntityMode } from "../../shared/enums/activeEntityMode";
import Placeholder from "../../shared/components/Placeholder/Placeholder";
import CashAccountHeader from "./components/CashAccountHeader";
import { CurrencyTransactionsTable } from "./components/CurrencyTransactionsTable/CurrencyTransactionsTable";
import CollectionPagination from "../../shared/components/CollectionPagination/CollectionPagination";
import { PaginationConfig } from "../../shared/models/PaginationConfig";

interface State {
    currencyTransactions: CurrencyTransactionEntity[],
}

const CashAccountPage: React.FC = () => {
    const { cashAccountId } = useParams();
    const { t } = useTranslation();

    const { user } = useUserProfile();

    const [state, setState] = useState<State>({ currencyTransactions: [] });
    const [currenciesMap, setCurrenciesMap] = useState<Record<string, number>>({});
    const [account, setAccount] = useState<AccountEntity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [totalPnl, setTotalPnl] = useState<number>(0);
    const [transactionsCount, setTransactionsCount] = useState<number>(0);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [paginationVersion, setPaginationVersion] = useState<number>(0);

    const { 
        activeEntity,
        modalRef,
        confirmModalRef,
        onAddClicked,
        onEditClicked,
        onDeleteClicked,
        mode,
        onActionEnded
    } = useEntityModal<CurrencyTransactionEntity>();

    const getPaginationConfig = useCallback(async (): Promise<PaginationConfig | void> => {
        if (!cashAccountId) return;
        return await getCurrencyTransactionsPagination(cashAccountId);
    }, [cashAccountId, paginationVersion]);

    const loadTransactions = async (page: number, size: number) => {
        if (!cashAccountId) return;
        const currencyTransactions = await getCurrencyTransactionsByAccountId(cashAccountId, page, size);
        setState({ currencyTransactions });
    };

    const handlePageChanged = (recordsQuantity: number, page: number) => {
        const actualPage = page === 0 ? 1 : page;
        setPageSize(recordsQuantity);
        setCurrentPage(actualPage);
        loadTransactions(actualPage, recordsQuantity);
    };

    const initData = async () => {
        if (!cashAccountId) return;
        setIsLoading(true);
        try {
            const [accountData, currencyTransactions, map, summary] = await Promise.all([
                getAccountById(cashAccountId),
                getCurrencyTransactionsByAccountId(cashAccountId, currentPage, pageSize),
                getCurrenciesMap(),
                getCurrencyAccountSummary(cashAccountId)
            ]);
            setAccount(accountData);
            setCurrenciesMap(map);
            setState({ currencyTransactions });
            setTotalPnl(summary?.totalPnl ?? 0);
            setTransactionsCount(summary?.transactionsCount ?? 0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (mode !== ActiveEntityMode.None) {
            return;
        }
        if (!cashAccountId) return;
        setPaginationVersion(v => v + 1);
        initData();
    }, [mode, cashAccountId]);

    const onCurrencyTransactionSaved = async (transaction: CurrencyTransactionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createCurrencyTransaction(transaction);
        } else {
            await updateCurrencyTransaction(transaction);
        }
        onActionEnded();
    };

    const onDeleteConfirmed = async () => {
        if (!activeEntity) return;
        await deleteCurrencyTransaction(activeEntity.id);
        onActionEnded();
    };

    return (
        <Stack pb={6} gap={4}>
            <CashAccountHeader
                account={account}
                totalPnl={totalPnl}
                userCurrencyName={user?.currency.name}
                transactionsCount={transactionsCount}
                onAddClicked={onAddClicked}
            />

            {!isLoading && state.currencyTransactions.length === 0 ? (
                <Placeholder text={t("currency_transactions_no_transactions")} />
            ) : (
                <>
                    <CurrencyTransactionsTable
                        transactions={state.currencyTransactions}
                        currenciesMap={currenciesMap}
                        user={user}
                        onEdit={onEditClicked}
                        onDelete={onDeleteClicked}
                    />
                    <CollectionPagination
                        key={`${cashAccountId}-${paginationVersion}`}
                        getPaginationConfig={getPaginationConfig}
                        onPageChanged={handlePageChanged}
                    />
                </>
            )}

            <CurrencyTransactionModal 
                modalRef={modalRef} 
                onSaved={onCurrencyTransactionSaved} 
                currencyTransaction={activeEntity} 
                currentAccount={account}
            />
            <ConfirmModal 
                onConfirmed={onDeleteConfirmed}
                title={t("currency_transactions_account_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
        </Stack>
    );
};

export default CashAccountPage;