import { BrokerAccountFundTransferEntity, BrokerAccountFundTransferEntityRequest, BrokerAccountFundTransferEntityResponse } from '@/models/brokers/BrokerAccountFundTransfer';
import { BasePageable } from '@/shared/models/BasePageable';
import { PagedResult } from '@/shared/models/PagedResult';
import { Nullable } from '@/shared/utilities/nullable';
import { createEntity, deleteEntity, getPagedEntities, updateEntity } from '@/api/basicApi';
import { prepareBrokerAccountFundsTransfer, prepareBrokerAccountFundsTransferRequest } from './brokerAccountFundsTransferMapping';

const basicUrl = `BrokerAccountFundsTransfer`;

export interface BrokerAccountFundsTransferQuery extends BasePageable {
    brokerAccountId?: Nullable<string>;
}

export const getPagedBrokerAccountFundsTransfers = async (query: BrokerAccountFundsTransferQuery): Promise<PagedResult<BrokerAccountFundTransferEntity>> => {
    const pagedResult = await getPagedEntities<BrokerAccountFundsTransferQuery, BrokerAccountFundTransferEntityResponse>(`${basicUrl}/GetAll`, query);
    return {
        ...pagedResult,
        items: (pagedResult?.items ?? []).map(prepareBrokerAccountFundsTransfer)
    };
};

export const createBrokerAccountFundsTransfer = async (addedBrokerAccountFundsTransfer: BrokerAccountFundTransferEntity): Promise<BrokerAccountFundTransferEntityResponse | void> => {
    return await createEntity<BrokerAccountFundTransferEntityRequest, BrokerAccountFundTransferEntityResponse>(basicUrl, 
        prepareBrokerAccountFundsTransferRequest(addedBrokerAccountFundsTransfer));
};

export const updateBrokerAccountFundsTransfer = async (updatedBrokerAccountFundsTransfer: BrokerAccountFundTransferEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareBrokerAccountFundsTransferRequest(updatedBrokerAccountFundsTransfer));
};

export const deleteBrokerAccountFundsTransfer = async (brokerAccountFundsTransferId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, brokerAccountFundsTransferId);
};
