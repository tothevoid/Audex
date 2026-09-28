
import { useMemo } from "react";
import {
    BrokerAccountFundsTransferQuery,
    createBrokerAccountFundsTransfer,
    deleteBrokerAccountFundsTransfer,
    getPagedBrokerAccountFundsTransfers,
    updateBrokerAccountFundsTransfer
} from "../../../api/brokers/brokerAccountFundsTransferApi";
import { BrokerAccountFundTransferEntity } from "../../../models/brokers/BrokerAccountFundTransfer";
import { Nullable } from "../../../shared/utilities/nullable";
import usePagedQuery from "../../../shared/hooks/usePagedQuery";

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
        initialPageSize,
        keySelector: (transfer) => transfer.id
    });

    const createFundTransferEntity = async (createdFundTransfer: BrokerAccountFundTransferEntity) => {
        await createBrokerAccountFundsTransfer(createdFundTransfer);
        refreshPage();
    };

    const updateFundTransferEntity = async (updatedFundTransfer: BrokerAccountFundTransferEntity) => {
        await updateBrokerAccountFundsTransfer(updatedFundTransfer);
        refreshPage();
    };

    const deleteFundTransferEntity = async (deletedFundTransfer: BrokerAccountFundTransferEntity) => {
        const fundTransferDeleted = await deleteBrokerAccountFundsTransfer(deletedFundTransfer.id);
        if (!fundTransferDeleted) {
            return;
        }
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
