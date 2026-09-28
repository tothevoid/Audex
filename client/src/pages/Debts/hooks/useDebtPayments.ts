import { useMemo } from "react";
import { DebtPaymentEntity } from "../../../models/debts/DebtPaymentEntity";
import {
    createDebtPayment,
    DebtPaymentsQuery,
    deleteDebtPayment,
    getPagedDebtPayments,
    updateDebtPayment
} from "../../../api/debts/debtPaymentApi";
import { Nullable } from "../../../shared/utilities/nullable";
import usePagedQuery from "../../../shared/hooks/usePagedQuery";

export interface UseDebtPaymentsOptions {
    debtId?: Nullable<string>;
    tagId?: Nullable<string>;
    initialPageSize?: number;
    onDataChanged: () => void;
}

export const useDebtPayments = (options: UseDebtPaymentsOptions) => {
    const {
        debtId,
        tagId,
        initialPageSize = 10,
        onDataChanged
    } = options;

    const filters = useMemo(() => ({
        debtId: debtId || undefined,
        tagId: tagId || undefined
    }), [debtId, tagId]);

    const {
        items: debtPayments,
        totalCount,
        pageIndex,
        pageSize,
        isLoading: isDebtPaymentsLoading,
        loadPage,
        refreshPage,
        reset
    } = usePagedQuery<DebtPaymentEntity, DebtPaymentsQuery>({
        fetchData: getPagedDebtPayments,
        filters,
        initialPageSize,
        keySelector: (payment) => payment.id
    });

    const createDebtPaymentEntity = async (createdDebtPayment: DebtPaymentEntity) => {
        const added = await createDebtPayment(createdDebtPayment);
        if (!added) {
            return;
        }
        refreshPage();
        onDataChanged();
    };

    const updateDebtPaymentEntity = async (updatedDebtPayment: DebtPaymentEntity) => {
        const updated = await updateDebtPayment(updatedDebtPayment);
        if (!updated) {
            return;
        }
        refreshPage();
        onDataChanged();
    };

    const deleteDebtPaymentEntity = async (deletedDebt: DebtPaymentEntity) => {
        const deleted = await deleteDebtPayment(deletedDebt.id);
        if (!deleted) {
            return;
        }
        refreshPage();
        onDataChanged();
    };

    return {
        debtPayments,
        totalCount,
        pageIndex,
        pageSize,
        isDebtPaymentsLoading,
        loadPage,
        refreshPage,
        reset,
        createDebtPaymentEntity,
        updateDebtPaymentEntity,
        deleteDebtPaymentEntity
    };
};
