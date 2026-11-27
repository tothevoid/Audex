import { BaseEntity } from "@/models/common/BaseEntity";
import { CryptoProviderEntity } from "./CryptoProviderEntity";

export interface CommonCryptoAccountEntity extends BaseEntity {
    name: string;
}

export interface CryptoAccountEntityRequest extends CommonCryptoAccountEntity {
    cryptoProviderId: string;
}

export interface CryptoAccountEntity extends CommonCryptoAccountEntity {
    cryptoProvider: CryptoProviderEntity;
}

export interface CryptoAccountEntityResponse extends CommonCryptoAccountEntity {
    cryptoProvider: CryptoProviderEntity;
}
