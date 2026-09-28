import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { DebtTagEntity } from "./DebtTagEntity";

interface CommonDebtEntity {
    id: string,
    name: string,
    amount: number
}

export interface DebtEntityRequest extends CommonDebtEntity {
    currencyId: string,
    date: string
}

export interface DebtEntity extends CommonDebtEntity {
    currency: CurrencyEntity,
    date: Date,
    debtTags?: DebtTagEntity[]
}

export interface DebtEntityResponse extends CommonDebtEntity {
    currency: CurrencyEntity,
    date: string,
    debtTags?: DebtTagEntity[]
}