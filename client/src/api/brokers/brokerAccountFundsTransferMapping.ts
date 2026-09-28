import { BrokerAccountFundTransferEntity, BrokerAccountFundTransferEntityRequest, BrokerAccountFundTransferEntityResponse } from "@/models/brokers/BrokerAccountFundTransfer";
import { prepareAccount } from "@/api/accounts/accountApiMapping";
import { prepareBrokerAccount } from "./brokerAccountApiMapping";

export const prepareBrokerAccountFundsTransferRequest = (brokerAccountFundsTransfer: BrokerAccountFundTransferEntity): BrokerAccountFundTransferEntityRequest => {
    return {
        id: brokerAccountFundsTransfer.id,
        accountId: brokerAccountFundsTransfer.account.id,
        brokerAccountId: brokerAccountFundsTransfer.brokerAccount.id,
        amount: brokerAccountFundsTransfer.amount,
        income: brokerAccountFundsTransfer.income,
        date: brokerAccountFundsTransfer.date
    };
}

export const prepareBrokerAccountFundsTransfer = (brokerAccountFundsTransfer: BrokerAccountFundTransferEntityResponse): BrokerAccountFundTransferEntity => {
    return {
        id: brokerAccountFundsTransfer.id,
        account: prepareAccount(brokerAccountFundsTransfer.account),
        brokerAccount: prepareBrokerAccount(brokerAccountFundsTransfer.brokerAccount),
        amount: brokerAccountFundsTransfer.amount,
        income: brokerAccountFundsTransfer.income,
        date: new Date(brokerAccountFundsTransfer.date),
    };
}