import { DividendPaymentEntity, DividendPaymentEntityRequest, DividendPaymentEntityResponse } from '../../models/brokers/DividendPaymentEntity';
import { BasePageable } from '../../shared/models/BasePageable';
import { PagedResult } from '../../shared/models/PagedResult';
import { Nullable } from '../../shared/utilities/nullable';
import { createEntity, deleteEntity, getEntity, getPagedEntities, updateEntity } from '../basicApi';
import { prepareDividendPayment, prepareDividendPaymentRequest } from './dividendPaymentApiMapping';

const basicUrl = `DividendPayment`;

export interface DividendPaymentsQuery extends BasePageable {
    brokerAccountId?: Nullable<string>;
}

export const getPagedDividendPayments = async (query: DividendPaymentsQuery): Promise<PagedResult<DividendPaymentEntity>> => {
    const pagedResult = await getPagedEntities<DividendPaymentsQuery, DividendPaymentEntityResponse>(`${basicUrl}/GetAll`, query);
    return {
        ...pagedResult,
        items: (pagedResult?.items ?? []).map(prepareDividendPayment)
    };
};

export const getEarningsByBrokerAccount = async (brokerAccountId: string): Promise<number> => {
    return await getEntity<number>(`${basicUrl}/GetEarningsByBrokerAccount?brokerAccountId=${brokerAccountId}`) ?? 0;
};

export const createDividendPayment = async (modifiedDividendPayment: DividendPaymentEntity): Promise<void> => {
    await createEntity<DividendPaymentEntityRequest, DividendPaymentEntityResponse>(basicUrl, prepareDividendPaymentRequest(modifiedDividendPayment))
}

export const updateDividendPayment = async (modifiedDividendPayment: DividendPaymentEntity): Promise<void>=> {
    await updateEntity<DividendPaymentEntityRequest>(basicUrl, prepareDividendPaymentRequest(modifiedDividendPayment));
}

export const deleteDividendPayment = async (brokerAccountSecurityId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, brokerAccountSecurityId);
}