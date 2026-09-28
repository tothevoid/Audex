import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";

export interface CommonUserProfileEntity {
    id: string,
    userName: string,
    languageCode: string,
    timeZoneId?: string
}

export interface UserProfileEntityRequest extends CommonUserProfileEntity {
    currencyId: string,
}

export interface UserProfileEntity extends CommonUserProfileEntity {
    currency: CurrencyEntity,
}

export interface UserProfileEntityResponse extends CommonUserProfileEntity {
    currency: CurrencyEntity,
}