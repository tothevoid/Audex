import { AccountTypeEntity } from '../../models/accounts/AccountTypeEntity';
import { createEntity, deleteEntity, getAllEntities, updateEntity } from '../basicApi';
import { prepareAccountType } from './accountTypeApiMapping';

const basicUrl = `AccountType`;

export const getAccountTypes = async (): Promise<AccountTypeEntity[]> => {
    const types = await getAllEntities<AccountTypeEntity>(basicUrl);
    return types.map(prepareAccountType);
};

export const createAccountType = async (accountType: AccountTypeEntity): Promise<AccountTypeEntity | void> => {
    return await createEntity(basicUrl, accountType);
}

export const updateAccountType = async (accountType: AccountTypeEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, accountType);
}

export const deleteAccountType = async (accountId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, accountId);
}