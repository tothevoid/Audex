import { useMemo } from "react";
import { DividendEntity } from "@/models/securities/DividendEntity";
import {
    createDividend,
    deleteDividend,
    DividendsQuery,
    getPagedDividends,
    updateDividend
} from "@/api/securities/dividendApi";
import usePagedQuery from "@/shared/hooks/usePagedQuery";
import { useTranslation } from "react-i18next";
import { notify } from "@/shared/components/Toaster";

export interface UseDividendsOptions {
    securityId: string;
    initialPageSize?: number;
}

export const useDividends = (options: UseDividendsOptions) => {
    const {
        securityId,
        initialPageSize = 10
    } = options;

    const filters = useMemo(() => ({
        securityId
    }), [securityId]);

    const {
        items: dividends,
        totalCount,
        pageIndex,
        pageSize,
        isLoading: isDividendsLoading,
        loadPage,
        refreshPage,
        reset
    } = usePagedQuery<DividendEntity, DividendsQuery>({
        fetchData: getPagedDividends,
        filters,
        initialPageSize
    });

    const { t } = useTranslation();

    const createDividendEntity = async (createdDividend: DividendEntity) => {
        const added = await createDividend(createdDividend);
        if (!added) {
            return;
        }
        const name = createdDividend.security?.name ?? "";
        notify.success(t("dividends_toast_created_title"), t("dividends_toast_created_desc", { name }));
        refreshPage();
    };

    const updateDividendEntity = async (updatedDividend: DividendEntity) => {
        const updated = await updateDividend(updatedDividend);
        if (!updated) {
            return;
        }
        const name = updatedDividend.security?.name ?? "";
        notify.success(t("dividends_toast_updated_title"), t("dividends_toast_updated_desc", { name }));
        refreshPage();
    };

    const deleteDividendEntity = async (deletedDividend: DividendEntity) => {
        const deleted = await deleteDividend(deletedDividend.id);
        if (!deleted) {
            return;
        }
        const name = deletedDividend.security?.name ?? "";
        notify.success(t("dividends_toast_deleted_title"), t("dividends_toast_deleted_desc", { name }));
        refreshPage();
    };

    return {
        dividends,
        totalCount,
        pageIndex,
        pageSize,
        isDividendsLoading,
        loadPage,
        refreshPage,
        reset,
        createDividendEntity,
        updateDividendEntity,
        deleteDividendEntity
    };
};
