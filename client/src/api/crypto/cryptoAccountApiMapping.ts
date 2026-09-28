import { CryptoAccountEntityResponse, CryptoAccountEntity, CryptoAccountEntityRequest } from "@/models/crypto/CryptoAccountEntity";

export const prepareCryptoAccountEntityRequest = (cryptoAccount: CryptoAccountEntity): CryptoAccountEntityRequest => {
    return {
        id: cryptoAccount.id,
        name: cryptoAccount.name,
        cryptoProviderId: cryptoAccount.cryptoProvider.id
    };
};

export const prepareCryptoAccount = (cryptoAccount: CryptoAccountEntityResponse): CryptoAccountEntity => {
    return {
        id: cryptoAccount.id,
        name: cryptoAccount.name,
        cryptoProvider: cryptoAccount.cryptoProvider
    };
};