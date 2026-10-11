
import { useMemo } from "react";
import {
    BrokerAccountFundsTransferQuery,
    createBrokerAccountFundsTransfer,
    deleteBrokerAccountFundsTransfer,
    getPagedBrokerAccountFundsTransfers,
    updateBrokerAccountFundsTransfer
} from "@/api/brokers/brokerAccountFundsTransferApi";
import { BrokerAccountFundTransferEntity } from "@/models/brokers/BrokerAccountFundTransfer";
import { Nullable } from "@/shared/utilities/nullable";
import usePagedQuery from "@/shared/hooks/usePagedQuery";
import { useTranslation } from "react-i18next";
import { notify } from "@/shared/components/Toaster";

export interface UseBrokerAccountFundTransfersOptions {
    brokerAccountId?: Nullable<string>;
    initialPageSize?: number;
}

export const useBrokerAccountFundTransfers = (options: UseBrokerAccountFundTransfersOptions = {}) => {
    const {
        brokerAccountId,
        initialPageSize = 10
    } = options;

    const filters = useMemo(() => ({
        brokerAccountId
    }), [brokerAccountId]);

    const {
        items: fundTransfers,
        totalCount,
        pageIndex,
        pageSize,
        isLoading: isFundTransfersLoading,
        loadPage,
        refreshPage,
        reset
    } = usePagedQuery<BrokerAccountFundTransferEntity, BrokerAccountFundsTransferQuery>({
        fetchData: getPagedBrokerAccountFundsTransfers,
        filters,
        initialPageSize
    });

    const { t } = useTranslation();

    const createFundTransferEntity = async (createdFundTransfer: BrokerAccountFundTransferEntity) => {
        await createBrokerAccountFundsTransfer(createdFundTransfer);
        const name = createdFundTransfer.brokerAccount?.name ?? createdFundTransfer.account?.name ?? "";
        notify.success(t("transfers_toast_created_title"), t("transfers_toast_created_desc", { name }));
        refreshPage();
    };

    const updateFundTransferEntity = async (updatedFundTransfer: BrokerAccountFundTransferEntity) => {
        await updateBrokerAccountFundsTransfer(updatedFundTransfer);
        const name = updatedFundTransfer.brokerAccount?.name ?? updatedFundTransfer.account?.name ?? "";
        notify.success(t("transfers_toast_updated_title"), t("transfers_toast_updated_desc", { name }));
        refreshPage();
    };

    const deleteFundTransferEntity = async (deletedFundTransfer: BrokerAccountFundTransferEntity) => {
        const fundTransferDeleted = await deleteBrokerAccountFundsTransfer(deletedFundTransfer.id);
        if (!fundTransferDeleted) {
            return;
        }
        const name = deletedFundTransfer.brokerAccount?.name ?? deletedFundTransfer.account?.name ?? "";
        notify.success(t("transfers_toast_deleted_title"), t("transfers_toast_deleted_desc", { name }));
        refreshPage();
    };

    return {
        fundTransfers,
        totalCount,
        pageIndex,
        pageSize,
        isFundTransfersLoading,
        loadPage,
        refreshPage,
        reset,
        createFundTransferEntity,
        updateFundTransferEntity,
        deleteFundTransferEntity
    };
};
