import { DepositMonthSummary } from '@/pages/Deposits/components/DepositStats/depositMonthSummary';
import { DepositsRange } from '@/models/deposits/depositsRange';
import { createEntity, deleteEntity, getAllEntitiesByConfig, getEntity, getEntityByConfig, updateEntity } from '@/api/basicApi';
import { DepositEntity, DepositEntityRequest, DepositEntityResponse } from '@/models/deposits/DepositEntity';
import { prepareDepositEntity, prepareDepositEntityRequest } from './depositApiMapping';

const basicUrl = `Deposit`;

export const getDeposits = async (monthsFrom: number, monthsTo: number, onlyActive: boolean): Promise<DepositEntity[]> => {
    return await getAllEntitiesByConfig<unknown, DepositEntityResponse>(`${basicUrl}/GetAll`, 
        {monthsFrom, monthsTo, onlyActive})
        .then((deposits: DepositEntityResponse[]) => deposits.map(prepareDepositEntity))
};

export const createDeposit = async (createdDeposit: DepositEntity): Promise<DepositEntity | void> => {
    return await createEntity<DepositEntityRequest, DepositEntityResponse>(basicUrl, prepareDepositEntityRequest(createdDeposit))
        .then((deposit) => deposit && prepareDepositEntity(deposit));
}

export const updateDeposit = async (modifiedDeposit: DepositEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareDepositEntityRequest(modifiedDeposit));
}

export const deleteDeposit = async (depositId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, depositId)
}

export const getDepositsRange = async (): Promise<DepositsRange | void> => {
    return getEntity(`${basicUrl}/GetDepositsRange`)
}

export const getDepositsSummary = async (monthsFrom: number, monthsTo: number, onlyActive: boolean): Promise<DepositMonthSummary | void> => {
    const url = `${basicUrl}/GetDepositsSummary`;
    return await getEntityByConfig(url, {monthsFrom, monthsTo, onlyActive})    
};
