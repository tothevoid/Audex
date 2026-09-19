import { AccountEntity, AccountEntityRequest, AccountEntityResponse } from "../../models/accounts/AccountEntity";
import { AccountCurrencySummary } from "../../models/accounts/accountsSummary";
import { createEntity, deleteEntity, getAllEntities, getAllEntitiesByConfig, postAction, updateEntity, getEntityById } from "../basicApi";
import { Transfer } from "../../pages/Accounts/modals/AccountBalanceTransferModal/AccountBalanceTransferModal";
import { prepareAccount, prepareAccountRequest } from "./accountApiMapping";

const basicUrl = `Account`;

export interface AccountGetAllConfig {
	onlyActive?: boolean;
	currencyId?: string | null;
	accountTypeId?: string | null;
}

export const getAccounts = async (config: AccountGetAllConfig = {}): Promise<AccountEntity[]> =>  {
	return await getAllEntitiesByConfig<unknown, AccountEntityResponse>(`${basicUrl}/GetAll`, config)
		.then((accountResponses: AccountEntityResponse[]) => accountResponses.map(prepareAccount));
}

export const getAccountsByTypes = async (typesIds: string[], onlyActive: boolean = false): Promise<AccountEntity[]> =>  {
	return await getAllEntitiesByConfig<unknown, AccountEntityResponse>(`${basicUrl}/GetAllByTypes`, 
		{onlyActive, typesIds})
		.then((accountResponses: AccountEntityResponse[]) => accountResponses.map(prepareAccount));
}

export const createAccount = async (newAccount: AccountEntity): Promise<string | void> => {
	const createdEntity = await createEntity<AccountEntityRequest, AccountEntityResponse>(basicUrl, prepareAccountRequest(newAccount));
	return createdEntity?.id;
}

export const updateAccount = async (modifiedAccount: AccountEntity): Promise<boolean> => {
	return await updateEntity(basicUrl, prepareAccountRequest(modifiedAccount));
}

export const deleteAccount = async (accountId: string): Promise<boolean> => {
	return await deleteEntity(basicUrl, accountId);
}

export const transferBalance = async (transfer: Transfer): Promise<boolean> => {
	if (!transfer) {
		return false;
	}

	const requestTransfer = {
		...transfer,
		from: transfer.from.id,
		to: transfer.to.id,
	}

	return await postAction(`${basicUrl}/Transfer`, requestTransfer);
}

export const getSummary = async (): Promise<AccountCurrencySummary[]> => {
	return await getAllEntities<AccountCurrencySummary>(`${basicUrl}/GetSummary`);
}

export const getAccountById = async (id: string): Promise<AccountEntity | null> => {
	const dto = await getEntityById<AccountEntityResponse>(basicUrl, id);
	if (!dto) return null;
	return prepareAccount(dto);
}