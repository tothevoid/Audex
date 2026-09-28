import { DebtPaymentEntityResponse, DebtPaymentEntity, DebtPaymentEntityRequest } from "@/models/debts/DebtPaymentEntity";
import { convertToDateOnly } from "@/shared/utilities/dateUtils";
import { prepareAccount } from "@/api/accounts/accountApiMapping";
import { prepareDebt } from "./debtApiMapping";

export const prepareDebtPaymentRequest = (debtPayment: DebtPaymentEntity): DebtPaymentEntityRequest => {
    return {
        id: debtPayment.id,
        amount: debtPayment.amount,
        debtId: debtPayment.debt.id,
        targetAccountId: debtPayment.targetAccount.id,
        date: convertToDateOnly(debtPayment.date),
        isPercentagePayment: debtPayment.isPercentagePayment
    };
};

export const prepareDebtPayment = (debtPayment: DebtPaymentEntityResponse): DebtPaymentEntity => {
    return {
        id: debtPayment.id,
        amount: debtPayment.amount,
        debt: prepareDebt(debtPayment.debt),
        targetAccount: prepareAccount(debtPayment.targetAccount),
        date: new Date(debtPayment.date),
        isPercentagePayment: debtPayment.isPercentagePayment
    };
};