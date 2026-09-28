import { TransactionTypeEntity } from "@/models/transactions/TransactionTypeEntity";
import { Nullable } from "@/shared/utilities/nullable";
import { createEntityWithIcon, deleteEntity, getAllEntities, updateEntityWithIcon } from "@/api/basicApi";
import { getStoredIconUrl } from "@/api/iconApi";

const basicUrl = `TransactionType`;
const ENTITY_NAME = "transactionTypeJson"
const ICON_NAME = "transactionTypeIcon"

export const getTransactionTypes = async (onlyActive: boolean = false): Promise<TransactionTypeEntity[]> =>  {
    const url = onlyActive ?
        `${basicUrl}?onlyActive=true`:
        basicUrl;

    return await getAllEntities<TransactionTypeEntity>(url)
}

export const createTransactionType = async (addedSecurity: TransactionTypeEntity, file: File | null): Promise<TransactionTypeEntity | void> => {
    return createEntityWithIcon<TransactionTypeEntity, TransactionTypeEntity>(basicUrl, 
        addedSecurity, ENTITY_NAME, ICON_NAME, file);
}

export const updateTransactionType = async (modifiedSecurity: TransactionTypeEntity, file: File | null): Promise<TransactionTypeEntity | void> => {
    return updateEntityWithIcon<TransactionTypeEntity, TransactionTypeEntity>(basicUrl, 
        modifiedSecurity, ENTITY_NAME, ICON_NAME, file);
}

export const deleteTransactionType = async (transactionTypeId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, transactionTypeId);
}

export const getTransactionTypeIconUrl = (iconKey: Nullable<string>): string => {
    if (!iconKey) {
        return "";
    }

    return getStoredIconUrl(basicUrl, iconKey);
}
