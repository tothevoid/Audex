import { BrokerAccountEntity, BrokerAccountEntityRequest, BrokerAccountEntityResponse } from '@/models/brokers/BrokerAccountEntity';
import { createEntity, deleteEntity, getAllEntities, getEntity, getEntityById, updateEntity } from '@/api/basicApi';
import { prepareBrokerAccount, prepareBrokerAccountRequest } from './brokerAccountApiMapping';

const basicUrl = `BrokerAccount`;

export const getBrokerAccounts = async (): Promise<BrokerAccountEntity[]> => {
    return await getAllEntities<BrokerAccountEntityResponse>(basicUrl)
        .then(brokerAccounts => brokerAccounts.map(prepareBrokerAccount));
};

export const getBrokerAccountById = async (id: string): Promise<BrokerAccountEntity | void> => {
    return getEntityById<BrokerAccountEntityResponse>(basicUrl, id)
        .then((brokerAccount: BrokerAccountEntityResponse | void) => brokerAccount && prepareBrokerAccount(brokerAccount))
}

export const getTotalSoldAmountByBrokerAccount = async (brokerAccountId: string): Promise<number | void> => {
    return getEntity<number>(`${basicUrl}/GetTotalSoldAmountByBrokerAccount?brokerAccountId=${brokerAccountId}`);
};

export const createBrokerAccount = async (addedBroker: BrokerAccountEntity): Promise<BrokerAccountEntity | void> => {
    return await createEntity<BrokerAccountEntityRequest, BrokerAccountEntityResponse>(basicUrl, prepareBrokerAccountRequest(addedBroker));
}

export const updateBrokerAccount = async (modifiedBroker: BrokerAccountEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareBrokerAccountRequest(modifiedBroker));
}

export const deleteBrokerAccount = async (deleteBrokerAccountId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, deleteBrokerAccountId);
}