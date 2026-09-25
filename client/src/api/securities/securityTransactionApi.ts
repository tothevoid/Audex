import { SecurityTransactionEntity, SecurityTransactionEntityRequest, SecurityTransactionEntityResponse } from '../../models/securities/SecurityTransactionEntity';
import { SecurityTransactionsHistory } from '../../models/securities/SecurityTransactionsHistory';
import { SecurityTransactionsRequest } from '../../models/securities/SecurityTransactionsRequest';
import { PagedResult } from '../../shared/models/PagedResult';
import { createEntity, deleteEntity, getAllEntities, getPagedEntities, updateEntity } from '../basicApi';
import { prepareSecurityTransaction } from './securityTransactionApiMapping';

const basicUrl = `SecurityTransaction`;

export const getSecurityTransactions = async (request: SecurityTransactionsRequest): Promise<PagedResult<SecurityTransactionEntity>> => {
    const pagedResult = await getPagedEntities<SecurityTransactionsRequest, SecurityTransactionEntityResponse>(
        `${basicUrl}/GetAll`,
        request
    );

    return {
        ...pagedResult,
        items: (pagedResult.items ?? []).map(prepareSecurityTransaction)
    };
};

export const getTransactionsBySecurity = async (securityId: string): Promise<SecurityTransactionsHistory[]> => {
    return getAllEntities<SecurityTransactionsHistory>(`${basicUrl}/GetTransactionsHistory?securityId=${securityId}`);
};

export const createSecurityTransaction = async (addedSecurityTransaction: SecurityTransactionEntityRequest): Promise<boolean | void> => {
    const createdSecurityTransaction = await createEntity<SecurityTransactionEntityRequest, SecurityTransactionEntityResponse>(basicUrl, 
        addedSecurityTransaction);

    return !!createdSecurityTransaction;
}

export const updateSecurityTransaction = async (modifiedSecurityTransaction: SecurityTransactionEntityRequest): Promise<boolean> => {
    return await updateEntity<SecurityTransactionEntityRequest>(basicUrl, modifiedSecurityTransaction);
}

export const deleteSecurityTransaction = async (securityTransactionId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, securityTransactionId);
}