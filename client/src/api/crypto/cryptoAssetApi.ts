import { CryptoAssetEntity, CryptoAssetEntityRequest, CryptoAssetEntityResponse } from '@/models/crypto/CryptoAssetEntity';
import { createEntity, deleteEntity, getAllEntities, getEntity, updateEntity } from '@/api/basicApi';
import { prepareCryptoAsset, prepareCryptoAssetRequest } from './cryptoAssetApiMapping';
import { Nullable } from '@/shared/utilities/nullable';

const basicUrl = 'CryptoAsset';

export const getTotalBalance = async (cryptoAccountId: Nullable<string> = null): Promise<number> => {
    const url = cryptoAccountId
        ? `${basicUrl}/GetTotalBalanceByCryptoAccount?cryptoAccountId=${cryptoAccountId}`
        : `${basicUrl}/GetTotalBalance`;
    return await getEntity<number>(url) ?? 0;
};

export const getCryptoAssets = async (): Promise<CryptoAssetEntity[]> => {
    return await getAllEntities<CryptoAssetEntityResponse>(basicUrl)
        .then(cryptoAssets => cryptoAssets.map(prepareCryptoAsset));
};

export const getCryptoAssetsByCryptoAccount = async (cryptoAccountId: string): Promise<CryptoAssetEntity[]> => {
    return await getAllEntities<CryptoAssetEntityResponse>(`${basicUrl}/GetByCryptoAccount?cryptoAccountId=${cryptoAccountId}`)
        .then((cryptoAssets: CryptoAssetEntityResponse[]) => cryptoAssets.map(prepareCryptoAsset));
};

export const createCryptoAsset = async (addedCryptoAsset: CryptoAssetEntity): Promise<CryptoAssetEntity | void> => {
    return await createEntity<CryptoAssetEntityRequest, CryptoAssetEntityResponse>(basicUrl, prepareCryptoAssetRequest(addedCryptoAsset))
        .then((cryptoAsset) => cryptoAsset && prepareCryptoAsset(cryptoAsset));
};

export const updateCryptoAsset = async (modifiedCryptoAsset: CryptoAssetEntity): Promise<boolean> => {
    return await updateEntity<CryptoAssetEntityRequest>(basicUrl, prepareCryptoAssetRequest(modifiedCryptoAsset));
};

export const deleteCryptoAsset = async (cryptoAssetId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, cryptoAssetId);
};
