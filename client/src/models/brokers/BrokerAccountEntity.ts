import { BaseEntity } from "@/models/common/BaseEntity";
import { BankEntity } from "@/models/banks/BankEntity";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { BrokerAccountTypeEntity } from "./BrokerAccountTypeEntity";
import { BrokerEntity } from "./BrokerEntity";

export interface CommonBrokerAccountEntity extends BaseEntity {
    name: string;
    mainCurrencyAmount: number;
}

export interface BrokerAccountEntityRequest extends CommonBrokerAccountEntity {
    typeId: string;
    currencyId: string;
    brokerId: string;
    bankId?: string;
}

export interface BrokerAccountEntity extends CommonBrokerAccountEntity {
    type: BrokerAccountTypeEntity;
    currency: CurrencyEntity;
    broker: BrokerEntity;
    bank?: BankEntity;
}

export interface BrokerAccountEntityResponse extends CommonBrokerAccountEntity {
    type: BrokerAccountTypeEntity;
    currency: CurrencyEntity;
    broker: BrokerEntity;
    bank?: BankEntity;
}
