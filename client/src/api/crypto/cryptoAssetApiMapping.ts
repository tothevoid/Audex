import { CryptoAssetEntityResponse, CryptoAssetEntity, CryptoAssetEntityRequest } from '@/models/crypto/CryptoAssetEntity';
import { prepareCryptoAccount } from './cryptoAccountApiMapping';

export const prepareCryptoAssetRequest = (cryptoAsset: CryptoAssetEntity): CryptoAssetEntityRequest => {
    return {
        id: cryptoAsset.id,
        cryptoAccountId: cryptoAsset.cryptoAccount.id,
        cryptocurrencyId: cryptoAsset.cryptocurrency.id,
        quantity: cryptoAsset.quantity
    };
};

export const prepareCryptoAsset = (cryptoAssetResponse: CryptoAssetEntityResponse): CryptoAssetEntity => {
    return {
        id: cryptoAssetResponse.id,
        quantity: cryptoAssetResponse.quantity,
        cryptoAccount: prepareCryptoAccount(cryptoAssetResponse.cryptoAccount),
        cryptocurrency: cryptoAssetResponse.cryptocurrency
    };
};
