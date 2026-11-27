import { BaseEntity } from "@/models/common/BaseEntity";
import { CryptoAccountEntity, CryptoAccountEntityResponse } from './CryptoAccountEntity';
import { CryptocurrencyEntity } from './CryptocurrencyEntity';

export interface CommonCryptoAssetEntity extends BaseEntity {
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
