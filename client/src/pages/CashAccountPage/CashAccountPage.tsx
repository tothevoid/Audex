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
import { useCurrenciesMap } from "@/shared/hooks/queries/useCurrencies";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import CurrencyTransactionModal from "@/pages/Transactions/modals/CurrencyTransactionModal/CurrencyTransactionModal";
import { useEntityModal } from "@/shared/hooks/useEntityModal";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import CashAccountHeader from "./components/CashAccountHeader";
import { CurrencyTransactionsTable } from "./components/CurrencyTransactionsTable/CurrencyTransactionsTable";
import CollectionPagination from "@/shared/components/CollectionPagination/CollectionPagination";
import usePagedQuery from "@/shared/hooks/usePagedQuery";
import { notify } from "@/shared/components/Toaster";

const CashAccountPage: React.FC = () => {
    const { cashAccountId } = useParams();
    const { t } = useTranslation();

    const { user } = useUserProfile();

    const { data: currenciesMap = {} } = useCurrenciesMap();
    const [account, setAccount] = useState<AccountEntity | null>(null);
    const [isHeaderLoading, setIsHeaderLoading] = useState<boolean>(true);
    const [totalPnl, setTotalPnl] = useState<number>(0);
    const [transactionsCount, setTransactionsCount] = useState<number>(0);
    const { confirmDelete } = useConfirm();

    const {
        activeEntity,
        modalRef,
        onAddClicked,
        onEditClicked,
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
        filters
    });

    const loadAccountAndSummary = useCallback(async () => {
        if (!cashAccountId) return;
        setIsHeaderLoading(true);
        try {
            const [accountData, summary] = await Promise.all([
                getAccountById(cashAccountId),
                getCurrencyAccountSummary(cashAccountId)
            ]);
            setAccount(accountData);
            setTotalPnl(summary?.totalPnl ?? 0);
            setTransactionsCount(summary?.transactionsCount ?? 0);
        } finally {
            setIsHeaderLoading(false);
        }
    }, [cashAccountId]);

    useEffect(() => {
        if (mode !== ActiveEntityMode.None || !cashAccountId) {
            return;
        }
        let isMounted = true;
        const load = async () => {
            setIsHeaderLoading(true);
            try {
                const [accountData, summary] = await Promise.all([
                    getAccountById(cashAccountId),
                    getCurrencyAccountSummary(cashAccountId)
                ]);
                if (isMounted) {
                    setAccount(accountData);
                    setTotalPnl(summary?.totalPnl ?? 0);
                    setTransactionsCount(summary?.transactionsCount ?? 0);
                }
            } finally {
                if (isMounted) {
                    setIsHeaderLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [mode, cashAccountId]);

    const onCurrencyTransactionSaved = async (transaction: CurrencyTransactionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createCurrencyTransaction(transaction);
            notify.success(
                t("currency_transaction_toast_created_title"),
                t("currency_transaction_toast_created_desc", { name: transaction.name })
            );
        } else {
            await updateCurrencyTransaction(transaction);
            notify.success(
                t("currency_transaction_toast_updated_title"),
                t("currency_transaction_toast_updated_desc", { name: transaction.name })
            );
        }
        onActionEnded();
        refreshPage();
        loadAccountAndSummary();
    };

    const onDeleteClicked = useCallback(async (transaction: CurrencyTransactionEntity) => {
        const confirmed = await confirmDelete(t("currency_transactions_account_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteCurrencyTransaction(transaction.id);
        notify.success(
            t("currency_transaction_toast_deleted_title"),
            t("currency_transaction_toast_deleted_desc", { name: transaction.name })
        );
        refreshPage();
        loadAccountAndSummary();
    }, [confirmDelete, loadAccountAndSummary, refreshPage, t]);

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
        </Stack>
    );
};

export default CashAccountPage;