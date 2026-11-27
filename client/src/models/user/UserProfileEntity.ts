import { BaseEntity } from "@/models/common/BaseEntity";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { LanguageEntity } from "@/models/common/LanguageEntity";

export interface CommonUserProfileEntity extends BaseEntity {
    userName: string;
    timeZoneId?: string;
}

export interface UserProfileEntity extends CommonUserProfileEntity {
    currency: CurrencyEntity;
    language: LanguageEntity;
}

export interface UserProfileEntityRequest extends CommonUserProfileEntity {
    currencyId: string;
    languageCode: string;
}
