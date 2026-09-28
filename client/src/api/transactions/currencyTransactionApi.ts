import { CurrencyAccountSummaryEntity } from '@/models/transactions/CurrencyAccountSummaryEntity';
import { CurrencyTransactionEntity, CurrencyTransactionEntityRequest, CurrencyTransactionEntityResponse } from '@/models/transactions/CurrencyTransactionEntity';
import { BasePageable } from '@/shared/models/BasePageable';
import { PagedResult } from '@/shared/models/PagedResult';
import { createEntity, deleteEntity, getEntityById, getEntity, getPagedEntities, updateEntity } from '@/api/basicApi';
import { prepareCurrencyTransaction, prepareCurrencyTransactionRequest } from './currencyTransactionApiMapping';

const basicUrl = `CurrencyTransaction`;

export interface CurrencyTransactionsQuery extends BasePageable {
	accountId?: string;
}

export const getPagedCurrencyTransactions = async (query: CurrencyTransactionsQuery): Promise<PagedResult<CurrencyTransactionEntity>> => {
	const pagedResult = await getPagedEntities<CurrencyTransactionsQuery, CurrencyTransactionEntityResponse>(`${basicUrl}/GetAll`, query);
	return {
		...pagedResult,
		items: pagedResult.items.map(prepareCurrencyTransaction)
	};
};

export const createCurrencyTransaction = async (addedSecurityTransaction: CurrencyTransactionEntity): Promise<void> => {
	await createEntity<CurrencyTransactionEntityRequest, CurrencyTransactionEntityResponse>(basicUrl, 
		prepareCurrencyTransactionRequest(addedSecurityTransaction));
}

export const updateCurrencyTransaction = async (modifiedSecurityTransaction: CurrencyTransactionEntity): Promise<boolean> => {
	return await updateEntity(basicUrl, prepareCurrencyTransactionRequest(modifiedSecurityTransaction));
}

export const deleteCurrencyTransaction = async (securityTransactionId: string): Promise<boolean> => {
	return await deleteEntity(basicUrl, securityTransactionId);
}

export const getCurrencyTransactionById = async (id: string): Promise<CurrencyTransactionEntity | null> => {
	const dto = await getEntityById<CurrencyTransactionEntityResponse>(basicUrl, id);
	if (!dto) return null;
	return prepareCurrencyTransaction(dto);
};

export const getCurrencyAccountSummary = async (accountId: string): Promise<CurrencyAccountSummaryEntity | null> => {
	const result = await getEntity<CurrencyAccountSummaryEntity>(`${basicUrl}/GetSummaryByAccountId?accountId=${accountId}`);
	return result ?? null;
};