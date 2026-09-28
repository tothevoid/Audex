import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Stack } from "@chakra-ui/react";
import { getAccountById } from "@/api/accounts/accountApi";
import {
    createCurrencyTransaction,
    CurrencyTransactionsQuery,
    deleteCurrencyTransaction,
    getCurrencyAccountSummary,
    getPagedCurrencyTransactions,
    updateCurrencyTransaction
} from "@/api/transactions/currencyTransactionApi";
import { CurrencyTransactionEntity } from "@/models/transactions/CurrencyTransactionEntity";
import { useTranslation } from "react-i18next";
import { getCurrenciesMap } from "@/api/currencies/currencyApi";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import CurrencyTransactionModal from "@/pages/Transactions/modals/CurrencyTransactionModal/CurrencyTransactionModal";
import { ConfirmModal } from "@/shared/modals/ConfirmModal/ConfirmModal";
import { useEntityModal } from "@/shared/hooks/useEntityModal";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import CashAccountHeader from "./components/CashAccountHeader";
import { CurrencyTransactionsTable } from "./components/CurrencyTransactionsTable/CurrencyTransactionsTable";
import CollectionPagination from "@/shared/components/CollectionPagination/CollectionPagination";
import usePagedQuery from "@/shared/hooks/usePagedQuery";

const CashAccountPage: React.FC = () => {
    const { cashAccountId } = useParams();
    const { t } = useTranslation();

    const { user } = useUserProfile();

    const [currenciesMap, setCurrenciesMap] = useState<Record<string, number>>({});
    const [account, setAccount] = useState<AccountEntity | null>(null);
    const [isHeaderLoading, setIsHeaderLoading] = useState<boolean>(true);
    const [totalPnl, setTotalPnl] = useState<number>(0);
    const [transactionsCount, setTransactionsCount] = useState<number>(0);

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

    const filters = useMemo(() => ({
        accountId: cashAccountId
    }), [cashAccountId]);

    const {
        items: currencyTransactions,
        totalCount,
        pageIndex,
        pageSize,
        isLoading: isTransactionsLoading,
        loadPage,
        refreshPage
    } = usePagedQuery<CurrencyTransactionEntity, CurrencyTransactionsQuery>({
        fetchData: getPagedCurrencyTransactions,
        filters,
        keySelector: (transaction) => transaction.id
    });

    const loadAccountAndSummary = useCallback(async () => {
        if (!cashAccountId) return;
        setIsHeaderLoading(true);
        try {
            const [accountData, map, summary] = await Promise.all([
                getAccountById(cashAccountId),
                getCurrenciesMap(),
                getCurrencyAccountSummary(cashAccountId)
            ]);
            setAccount(accountData);
            setCurrenciesMap(map);
            setTotalPnl(summary?.totalPnl ?? 0);
            setTransactionsCount(summary?.transactionsCount ?? 0);
        } finally {
            setIsHeaderLoading(false);
        }
    }, [cashAccountId]);

    useEffect(() => {
        if (mode !== ActiveEntityMode.None) {
            return;
        }
        if (!cashAccountId) return;
        loadAccountAndSummary();
    }, [mode, cashAccountId, loadAccountAndSummary]);

    const onCurrencyTransactionSaved = async (transaction: CurrencyTransactionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createCurrencyTransaction(transaction);
        } else {
            await updateCurrencyTransaction(transaction);
        }
        onActionEnded();
        refreshPage();
    };

    const onDeleteConfirmed = async () => {
        if (!activeEntity) return;
        await deleteCurrencyTransaction(activeEntity.id);
        onActionEnded();
        refreshPage();
    };

    const isLoading = isHeaderLoading || isTransactionsLoading;

    return (
        <Stack pb={6} gap={4}>
            <CashAccountHeader
                account={account}
                totalPnl={totalPnl}
                userCurrencyName={user?.currency.name}
                transactionsCount={transactionsCount}
                onAddClicked={onAddClicked}
            />

            {!isLoading && currencyTransactions.length === 0 ? (
                <Placeholder text={t("currency_transactions_no_transactions")} />
            ) : (
                <>
                    <CurrencyTransactionsTable
                        transactions={currencyTransactions}
                        currenciesMap={currenciesMap}
                        user={user}
                        onEdit={onEditClicked}
                        onDelete={onDeleteClicked}
                    />
                    <CollectionPagination
                        count={totalCount}
                        page={pageIndex}
                        pageSize={pageSize}
                        onPageChange={loadPage}
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