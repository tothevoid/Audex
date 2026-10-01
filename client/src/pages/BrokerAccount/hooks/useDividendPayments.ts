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

    const createDividendPaymentEntity = async (createdDividendPayment: DividendPaymentEntity) => {
        await createDividendPayment(createdDividendPayment);
        refreshPage();
        onDataChanged();
    };

    const updateDividendPaymentEntity = async (updatedDividendPayment: DividendPaymentEntity) => {
        await updateDividendPayment(updatedDividendPayment);
        refreshPage();
        onDataChanged();
    };

    const deleteDividendPaymentEntity = async (deletedDividendPayment: DividendPaymentEntity) => {
        const securityTransactionDeleted = await deleteDividendPayment(deletedDividendPayment.id);
        if (!securityTransactionDeleted) {
            return;
        }
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
