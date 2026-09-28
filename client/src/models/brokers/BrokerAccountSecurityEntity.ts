import { BrokerAccountEntity, BrokerAccountEntityResponse } from "./BrokerAccountEntity";
import { SecurityEntity, SecurityEntityResponse } from "@/models/securities/SecurityEntity";

export interface CommonBrokerAccountSecurityEntity {
    id: string,
    quantity: number,
    price: number,
    soldPrice: number,
    soldQuantity: number
}

export interface BrokerAccountSecurityEntityRequest extends CommonBrokerAccountSecurityEntity {
    brokerAccountId: string,
    securityId: string
}

export interface BrokerAccountSecurityEntity extends CommonBrokerAccountSecurityEntity {
    brokerAccount: BrokerAccountEntity,
    security: SecurityEntity
}

export interface BrokerAccountSecurityEntityResponse extends CommonBrokerAccountSecurityEntity {
    brokerAccount: BrokerAccountEntityResponse,
    security: SecurityEntityResponse
}