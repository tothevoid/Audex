import { DebtEntityResponse, DebtEntity, DebtEntityRequest } from "@/models/debts/DebtEntity";
import { convertToDateOnly } from "@/shared/utilities/dateUtils";

export const prepareDebtRequest = (debt: DebtEntity): DebtEntityRequest => {
    return {
        id: debt.id,
        name: debt.name,
        amount: debt.amount,
        currencyId: debt.currency.id,
        date: convertToDateOnly(debt.date)
    };
}

export const prepareDebt = (debt: DebtEntityResponse): DebtEntity => {
    return {
        id: debt.id,
        amount: debt.amount,
        name: debt.name,
        currency: debt.currency,
        date: new Date(debt.date),
        debtTags: debt.debtTags || []
    };
}