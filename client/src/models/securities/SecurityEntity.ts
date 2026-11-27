import { BaseEntity } from "@/models/common/BaseEntity";
import { Nullable } from "@/shared/utilities/nullable";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { SecurityTypeEntity } from "./SecurityTypeEntity";

export interface CommonSecurityEntity extends BaseEntity {
    name: string;
    ticker: string;
    isin?: string;
    actualPrice: number;
    iconKey: string;
}

export interface SecurityEntityRequest extends CommonSecurityEntity {
    typeId: string;
    currencyId: string;
    priceFetchedAt: Nullable<Date>;
}

export interface SecurityEntity extends CommonSecurityEntity {
    type: SecurityTypeEntity;
    currency: CurrencyEntity;
    priceFetchedAt: Nullable<Date>;
}

export interface SecurityEntityResponse extends CommonSecurityEntity {
    type: SecurityTypeEntity;
    currency: CurrencyEntity;
    priceFetchedAt: Nullable<Date>;
}

export interface MarketSecurityInfoEntity {
    ticker: string;
    name: string;
    isin?: string;
    typeId?: string;
    currencyId?: string;
}
