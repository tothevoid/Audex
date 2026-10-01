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

    const createDividendEntity = async (createdDividend: DividendEntity) => {
        const added = await createDividend(createdDividend);
        if (!added) {
            return;
        }
        refreshPage();
    };

    const updateDividendEntity = async (updatedDividend: DividendEntity) => {
        const updated = await updateDividend(updatedDividend);
        if (!updated) {
            return;
        }
        refreshPage();
    };

    const deleteDividendEntity = async (deletedDividend: DividendEntity) => {
        const deleted = await deleteDividend(deletedDividend.id);
        if (!deleted) {
            return;
        }
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
