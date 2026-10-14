import { CryptoAccountEntity, CryptoAccountEntityResponse } from './CryptoAccountEntity';
import { CryptocurrencyEntity } from './CryptocurrencyEntity';

interface CommonCryptoAssetEntity {
    id: string;
    quantity: number;
}

export interface CryptoAssetEntityRequest extends CommonCryptoAssetEntity {
    cryptocurrencyId: string;
    cryptoAccountId: string;
}

export interface CryptoAssetEntity extends CommonCryptoAssetEntity {
    cryptocurrency: CryptocurrencyEntity;
    cryptoAccount: CryptoAccountEntity;
}

export interface CryptoAssetEntityResponse extends CommonCryptoAssetEntity {
    cryptocurrency: CryptocurrencyEntity;
    cryptoAccount: CryptoAccountEntityResponse;
}
