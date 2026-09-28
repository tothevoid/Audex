import { CryptocurrencyEntity } from '@/models/crypto/CryptocurrencyEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { createEntityWithIcon, deleteEntity, getAllEntities, updateEntityWithIcon } from '@/api/basicApi';
import { getStoredIconUrl } from '@/api/iconApi';

const basicUrl = `Cryptocurrency`;
const ENTITY_NAME = "cryptocurrencyJson";
const ICON_NAME = "cryptoCurrencyIcon";

export const getCryptocurrencies = async (): Promise<CryptocurrencyEntity[]> => {
    return await getAllEntities<CryptocurrencyEntity>(basicUrl);
};

export const createCryptocurrency = async (addedCryptocurrency: CryptocurrencyEntity, file: File | null): Promise<CryptocurrencyEntity | void> => {
    return await createEntityWithIcon<CryptocurrencyEntity, CryptocurrencyEntity>(basicUrl, addedCryptocurrency, ENTITY_NAME, ICON_NAME, file);
};

export const updateCryptocurrency = async (modifiedCryptocurrency: CryptocurrencyEntity, file: File | null): Promise<CryptocurrencyEntity | void> => {
    return await updateEntityWithIcon<CryptocurrencyEntity, CryptocurrencyEntity>(basicUrl, modifiedCryptocurrency, ENTITY_NAME, ICON_NAME, file);
};

export const deleteCryptocurrency = async (cryptoCurrencyId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, cryptoCurrencyId);
};

export const getIconUrl = (iconKey: Nullable<string>): string => {
    if (!iconKey) {
        return "";
    }

    return getStoredIconUrl(basicUrl, iconKey);
};