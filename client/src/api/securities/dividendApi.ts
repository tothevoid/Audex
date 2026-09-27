import { DividendEntity, DividendEntityRequest, DividendEntityResponse } from '../../models/securities/DividendEntity';
import { BasePageable } from '../../shared/models/BasePageable';
import { PagedResult } from '../../shared/models/PagedResult';
import { createEntity, deleteEntity, getAllEntities, getPagedEntities, updateEntity } from '../basicApi';
import { prepareDividend, prepareDividendRequest } from './dividendApiMapping';

const basicUrl = `Dividend`;

export interface DividendsQuery extends BasePageable {
    securityId: string;
}

export const getPagedDividends = async (query: DividendsQuery): Promise<PagedResult<DividendEntity>> => {
    const pagedResult = await getPagedEntities<DividendsQuery, DividendEntityResponse>(`${basicUrl}/GetAll`, query);
    return {
        ...pagedResult,
        items: pagedResult.items.map(prepareDividend)
    };
};

export const getAvailableDividends = async (brokerAccountId: string): Promise<DividendEntity[]> => {
    return await getAllEntities<DividendEntityResponse>(`${basicUrl}/GetAvailable?brokerAccountId=${brokerAccountId}`)
        .then(dividends => dividends.map(prepareDividend));
};

export const createDividend = async (dividend: DividendEntity): Promise<boolean> => {
    const result = await createEntity<DividendEntityRequest, DividendEntityResponse>(basicUrl, prepareDividendRequest(dividend));
    return !!result;
};

export const updateDividend = async (dividend: DividendEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareDividendRequest(dividend));
};

export const deleteDividend = async (dividendId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, dividendId);
};