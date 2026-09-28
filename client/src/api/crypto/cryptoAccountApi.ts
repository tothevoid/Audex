 import { CryptoAccountEntity, CryptoAccountEntityRequest, CryptoAccountEntityResponse } from '@/models/crypto/CryptoAccountEntity';
import { createEntity, deleteEntity, getAllEntities, getEntityById, updateEntity } from '@/api/basicApi';
import { prepareCryptoAccount, prepareCryptoAccountEntityRequest } from './cryptoAccountApiMapping';

const basicUrl = `CryptoAccount`;

export const getCryptoAccounts = async (): Promise<CryptoAccountEntity[]> => {
    return await getAllEntities<CryptoAccountEntityResponse>(basicUrl)
        .then(cryptoAccounts => cryptoAccounts.map(prepareCryptoAccount));
};

export const getCryptoAccountById = async (id: string): Promise<CryptoAccountEntity | void> => {
    return await getEntityById<CryptoAccountEntityResponse>(basicUrl, id)
        .then((cryptoAccountEntity) => cryptoAccountEntity && prepareCryptoAccount(cryptoAccountEntity));
}

export const createCryptoAccount = async (addedCryptoAccount: CryptoAccountEntity): Promise<CryptoAccountEntity | void> => {
    return await createEntity<CryptoAccountEntityRequest, CryptoAccountEntityResponse>(basicUrl, prepareCryptoAccountEntityRequest(addedCryptoAccount))
        .then((cryptoAccountEntity) => cryptoAccountEntity && prepareCryptoAccount(cryptoAccountEntity));
}

export const updateCryptoAccount = async (modifiedCryptoAccount: CryptoAccountEntity): Promise<boolean> => {
    return await updateEntity<CryptoAccountEntityRequest>(basicUrl, prepareCryptoAccountEntityRequest(modifiedCryptoAccount));
}

export const deleteCryptoAccount = async (cryptoAccountId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, cryptoAccountId);
}

