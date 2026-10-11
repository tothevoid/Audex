import { useMemo } from "react";
import {
    createDividendPayment,
    deleteDividendPayment,
    DividendPaymentsQuery,
    getPagedDividendPayments,
    updateDividendPayment
} from "@/api/brokers/dividendPaymentApi";
import { DividendPaymentEntity } from "@/models/brokers/DividendPaymentEntity";
import { Nullable } from "@/shared/utilities/nullable";
import usePagedQuery from "@/shared/hooks/usePagedQuery";
import { useTranslation } from "react-i18next";
import { notify } from "@/shared/components/Toaster";

export interface UseDividendPaymentsOptions {
    brokerAccountId?: Nullable<string>;
    initialPageSize?: number;
    onDataChanged: () => void;
}

export const useDividendPayments = (options: UseDividendPaymentsOptions) => {
    const {
        brokerAccountId,
        initialPageSize = 10,
        onDataChanged
    } = options;

    const filters = useMemo(() => ({
        brokerAccountId
    }), [brokerAccountId]);

    const {
        items: dividendPayments,
        totalCount,
        pageIndex,
        pageSize,
        isLoading: isSecurityTransactionsLoading,
        loadPage,
        refreshPage,
        reset
    } = usePagedQuery<DividendPaymentEntity, DividendPaymentsQuery>({
        fetchData: getPagedDividendPayments,
        filters,
        initialPageSize
    });

    const { t } = useTranslation();

    const createDividendPaymentEntity = async (createdDividendPayment: DividendPaymentEntity) => {
        await createDividendPayment(createdDividendPayment);
        const name = createdDividendPayment.dividend?.security?.name ?? "";
        notify.success(t("dividend_payment_toast_created_title"), t("dividend_payment_toast_created_desc", { name }));
        refreshPage();
        onDataChanged();
    };

    const updateDividendPaymentEntity = async (updatedDividendPayment: DividendPaymentEntity) => {
        await updateDividendPayment(updatedDividendPayment);
        const name = updatedDividendPayment.dividend?.security?.name ?? "";
        notify.success(t("dividend_payment_toast_updated_title"), t("dividend_payment_toast_updated_desc", { name }));
        refreshPage();
        onDataChanged();
    };

    const deleteDividendPaymentEntity = async (deletedDividendPayment: DividendPaymentEntity) => {
        const securityTransactionDeleted = await deleteDividendPayment(deletedDividendPayment.id);
        if (!securityTransactionDeleted) {
            return;
        }
        const name = deletedDividendPayment.dividend?.security?.name ?? "";
        notify.success(t("dividend_payment_toast_deleted_title"), t("dividend_payment_toast_deleted_desc", { name }));
        refreshPage();
        onDataChanged();
    };

    return {
        dividendPayments,
        totalCount,
        pageIndex,
        pageSize,
        isSecurityTransactionsLoading,
        loadPage,
        refreshPage,
        reset,
        createDividendPaymentEntity,
        updateDividendPaymentEntity,
        deleteDividendPaymentEntity
    };
};
