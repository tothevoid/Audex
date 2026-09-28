import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { createEntity, deleteEntity, getAction, getAllEntities, updateEntity } from "@/api/basicApi";

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
	currencies.forEach(c => { map[c.id] = c.rate; });
	return map;
};

export const createCurrency = async (newCurrency: CurrencyEntity): Promise<string | void> => {
	const result = await createEntity<CurrencyEntity, CurrencyEntity>(basicUrl, newCurrency);
	return result?.id;
};

export const updateCurrency = async (modifiedCurrency: CurrencyEntity): Promise<boolean> => {
	return await updateEntity<CurrencyEntity>(basicUrl, modifiedCurrency);
};

export const deleteCurrency = async (currencyId: string): Promise<boolean> => {
	return await deleteEntity(basicUrl, currencyId);
};