import { DepositEntityResponse, DepositEntity, DepositEntityRequest } from "@/models/deposits/DepositEntity";
import { convertToDateOnly } from "@/shared/utilities/dateUtils";

export const prepareDepositEntity = (deposit: DepositEntityResponse): DepositEntity => {
    return {
        id: deposit.id,
        initialAmount: deposit.initialAmount,
        name: deposit.name,
        bank: deposit.bank,
        percentage: deposit.percentage,
        currency: deposit.currency,
        estimatedEarn: deposit.estimatedEarn,
        from: new Date(deposit.from),
        to: new Date(deposit.to),
    };
};

export const prepareDepositEntityRequest = (deposit: DepositEntity): DepositEntityRequest => {
    return {
        id: deposit.id,
        initialAmount: deposit.initialAmount,
        name: deposit.name,
        percentage: deposit.percentage,
        estimatedEarn: deposit.estimatedEarn,
        currencyId: deposit.currency?.id,
        from: convertToDateOnly(deposit.from),
        to: convertToDateOnly(deposit.to),
        bankId: deposit.bank?.id
    };
};
