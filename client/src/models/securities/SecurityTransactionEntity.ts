import { BrokerAccountEntity, BrokerAccountEntityResponse } from "@/models/brokers/BrokerAccountEntity";
import { SecurityEntity, SecurityEntityResponse } from "./SecurityEntity";

interface CommonSecurityTransactionEntity {
    id: string,
    quantity: number,
    price: number,
    brokerCommission: number,
    stockExchangeCommission: number,
    tax: number
    isSell: boolean
}

export interface SecurityTransactionEntityRequest extends CommonSecurityTransactionEntity {
    securityId: string,
    brokerAccountId: string,
    date: Date
}

export interface SecurityTransactionEntity extends CommonSecurityTransactionEntity {
    security: SecurityEntity,
    brokerAccount: BrokerAccountEntity,
    date: Date,
}

export interface SecurityTransactionEntityResponse extends CommonSecurityTransactionEntity {
    security: SecurityEntityResponse,
    brokerAccount: BrokerAccountEntityResponse,
    date: string
}
