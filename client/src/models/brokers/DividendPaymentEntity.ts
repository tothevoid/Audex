import { BaseEntity } from "@/models/common/BaseEntity";
import { DividendEntity, DividendEntityResponse } from "@/models/securities/DividendEntity";
import { BrokerAccountEntity, BrokerAccountEntityResponse } from "./BrokerAccountEntity";

export interface CommonDividendPaymentEntity extends BaseEntity {
    securitiesQuantity: number;
    tax: number;
}

export interface DividendPaymentEntityRequest extends CommonDividendPaymentEntity {
    brokerAccountId: string;
    dividendId: string;
    receivedAt: string;
}

export interface DividendPaymentEntity extends CommonDividendPaymentEntity {
    brokerAccount: BrokerAccountEntity;
    dividend: DividendEntity;
    receivedAt: Date;
}

export interface DividendPaymentEntityResponse extends CommonDividendPaymentEntity {
    brokerAccount: BrokerAccountEntityResponse;
    dividend: DividendEntityResponse;
    receivedAt: string;
}
