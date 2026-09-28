import { BankEntity } from '@/models/banks/BankEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { createEntityWithIcon, deleteEntity, getAllEntities, updateEntityWithIcon } from '@/api/basicApi';
import { getStoredIconUrl } from '@/api/iconApi';

const basicUrl = `Bank`;

const ENTITY_NAME = "bankJson"
const ICON_NAME = "bankIcon"

export const getBanks = async (): Promise<BankEntity[]> => {
   return await getAllEntities<BankEntity>(basicUrl);
};

export const createBank = async (addedBank: BankEntity, file: Nullable<File>): Promise<BankEntity | void> => {
    return await createEntityWithIcon<BankEntity, BankEntity>(basicUrl, 
        addedBank, ENTITY_NAME, ICON_NAME, file);
}

export const updateBank = async (modifiedBank: BankEntity, file: Nullable<File>): Promise<BankEntity | void> => {
    return await updateEntityWithIcon(basicUrl, modifiedBank, ENTITY_NAME, ICON_NAME, file);
}

export const deleteBank = async (bankId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, bankId);
}

export const getBankIconUrl = (iconKey: Nullable<string>): string => {
    if (!iconKey) {
        return "";
    }

    return getStoredIconUrl(basicUrl, iconKey);
}