import { AccountEntity, AccountEntityResponse } from "@/models/accounts/AccountEntity";
import { BrokerAccountEntity, BrokerAccountEntityResponse } from "./BrokerAccountEntity";

interface CommonBrokerAccountFundTransfer {
    id: string,
    amount: number,
    income: boolean
}

export interface BrokerAccountFundTransferEntityRequest extends CommonBrokerAccountFundTransfer{
    accountId: string,
    brokerAccountId: string,
    date: Date
}

export interface BrokerAccountFundTransferEntity extends CommonBrokerAccountFundTransfer {
    account: AccountEntity,
    brokerAccount: BrokerAccountEntity,
    date: Date
}

export interface BrokerAccountFundTransferEntityResponse extends CommonBrokerAccountFundTransfer{
    account: AccountEntityResponse,
    brokerAccount: BrokerAccountEntityResponse,
    date: string
}