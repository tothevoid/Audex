import { BrokerAccountTaxDeductionEntity, BrokerAccountTaxDeductionEntityRequest, BrokerAccountTaxDeductionEntityResponse, } from "@/models/brokers/BrokerAccountTaxDeductionEntity";
import { prepareBrokerAccount } from "./brokerAccountApiMapping";

export const prepareBrokerAccountTaxDeductionRequest = (entity: BrokerAccountTaxDeductionEntity): BrokerAccountTaxDeductionEntityRequest => {
    return {
        id: entity.id,
        name: entity.name,
        amount: entity.amount,
        dateApplied: entity.dateApplied,
        brokerAccountId: entity.brokerAccount.id,
    };
};

export const prepareBrokerAccountTaxDeductionResponse = (response: BrokerAccountTaxDeductionEntityResponse): BrokerAccountTaxDeductionEntity => {
    return {
        id: response.id,
        name: response.name,
        amount: response.amount,
        dateApplied: new Date(response.dateApplied),
        brokerAccount: prepareBrokerAccount(response.brokerAccount),
    };
};