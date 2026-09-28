import { AccountEntity, AccountEntityResponse } from "@/models/accounts/AccountEntity";
import { DebtEntity, DebtEntityResponse } from "./DebtEntity";

export interface CommonDebtPaymentEntity {
    id: string,
    amount: number,
    isPercentagePayment: boolean
}

export interface DebtPaymentEntityRequest extends CommonDebtPaymentEntity {
    targetAccountId: string,
    debtId: string,
    date: string
}

export interface DebtPaymentEntity extends CommonDebtPaymentEntity {
    targetAccount: AccountEntity,
    debt: DebtEntity,
    date: Date
}

export interface DebtPaymentEntityResponse extends CommonDebtPaymentEntity {
    targetAccount: AccountEntityResponse,
    debt: DebtEntityResponse,
    date: string
}