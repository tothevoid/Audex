import { CryptoProviderEntity } from '@/models/crypto/CryptoProviderEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { createEntityWithIcon, deleteEntity, getAllEntities, updateEntityWithIcon } from '@/api/basicApi';
import { getStoredIconUrl } from '@/api/iconApi';

const basicUrl = `CryptoProvider`;

const ENTITY_NAME = "cryptoProviderJson";
const ICON_NAME = "cryptoProviderIcon";

export const getCryptoProviders = async (): Promise<CryptoProviderEntity[]> => {
   return await getAllEntities<CryptoProviderEntity>(basicUrl);
};

export const createCryptoProvider = async (addedCryptoProvider: CryptoProviderEntity, file: Nullable<File>): Promise<CryptoProviderEntity | void> => {
    return await createEntityWithIcon<CryptoProviderEntity, CryptoProviderEntity>(basicUrl, addedCryptoProvider, ENTITY_NAME, ICON_NAME, file);
};

export const updateCryptoProvider = async (modifiedCryptoProvider: CryptoProviderEntity, file: Nullable<File>): Promise<CryptoProviderEntity | void> => {
    return await updateEntityWithIcon(basicUrl, modifiedCryptoProvider, ENTITY_NAME, ICON_NAME, file);
};

export const deleteCryptoProvider = async (cryptoProviderId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, cryptoProviderId);
};

export const getCryptoProviderIconUrl = (iconKey: Nullable<string>): string => {
    if (!iconKey) {
        return "";
    }

    return getStoredIconUrl(basicUrl, iconKey);
};