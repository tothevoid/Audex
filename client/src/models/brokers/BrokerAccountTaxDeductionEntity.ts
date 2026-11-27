import { BaseEntity } from "@/models/common/BaseEntity";
import { Nullable } from "@/shared/utilities/nullable";
import { BrokerAccountEntity, BrokerAccountEntityResponse } from "./BrokerAccountEntity";

export interface TaxDeductionsQuery {
    brokerAccountId: Nullable<string>;
}

export interface CommonBrokerAccountTaxDeduction extends BaseEntity {
    amount: number;
    name: string;
}

export interface BrokerAccountTaxDeductionEntityRequest extends CommonBrokerAccountTaxDeduction {
    brokerAccountId: string;
    dateApplied: Date;
}

export interface BrokerAccountTaxDeductionEntity extends CommonBrokerAccountTaxDeduction {
    brokerAccount: BrokerAccountEntity;
    dateApplied: Date;
}

export interface BrokerAccountTaxDeductionEntityResponse extends CommonBrokerAccountTaxDeduction {
    brokerAccount: BrokerAccountEntityResponse;
    dateApplied: string;
}
