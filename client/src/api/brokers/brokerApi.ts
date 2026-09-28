import { BrokerEntity } from '@/models/brokers/BrokerEntity';
import { createEntity, deleteEntity, getAllEntities, updateEntity } from '@/api/basicApi';

const basicUrl = `Broker`;

export const getBrokers = async (): Promise<BrokerEntity[]> => {
   return await getAllEntities<BrokerEntity>(basicUrl);
};

export const createBroker = async (addedBroker: BrokerEntity): Promise<BrokerEntity | void> => {
    return await createEntity<BrokerEntity, BrokerEntity>(basicUrl, addedBroker);
}

export const updateBroker = async (modifiedBroker: BrokerEntity): Promise<boolean> => {
    return await updateEntity<BrokerEntity>(basicUrl, modifiedBroker);
}

export const deleteBroker = async (brokerId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, brokerId);
}