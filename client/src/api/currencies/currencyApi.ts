import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { createEntityResult, deleteEntity, getAction, getAllEntities, updateEntityResult } from "@/api/basicApi";
import { OperationResult } from "@/shared/models/OperationResult";

const basicUrl = `Currency`;

export const syncRates = async () =>  {
	await getAction(`${basicUrl}/SyncRates`);
};

export const getCurrencies = async (): Promise<CurrencyEntity[]> =>  {
	return await getAllEntities<CurrencyEntity>(basicUrl);
};

export const getCurrenciesMap = async (): Promise<Record<string, number>> => {
	const currencies = await getCurrencies();
	const map: Record<string, number> = {};
	currencies.forEach(currency => { map[currency.id] = currency.rate; });
	return map;
};

export const createCurrency = async (newCurrency: CurrencyEntity): Promise<OperationResult<string>> => {
	return await createEntityResult<CurrencyEntity, string>(basicUrl, newCurrency);
};

export const updateCurrency = async (modifiedCurrency: CurrencyEntity): Promise<OperationResult<boolean>> => {
	return await updateEntityResult<CurrencyEntity, boolean>(basicUrl, modifiedCurrency);
};

export const deleteCurrency = async (currencyId: string): Promise<boolean> => {
	return await deleteEntity(basicUrl, currencyId);
};