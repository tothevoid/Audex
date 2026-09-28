import { BankEntity } from "@/models/banks/BankEntity"
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity"

interface CommonDepositEntity {
    id: string,
    name: string,
    initialAmount: number,
    estimatedEarn?: number | null,
    percentage: number,
}

export interface DepositEntityRequest extends CommonDepositEntity {
    from: string,
    to: string,
    currencyId: string,
    bankId: string
}

export interface DepositEntity extends CommonDepositEntity {
    from: Date,
    to: Date,
    currency: CurrencyEntity,
    bank: BankEntity
}

export interface DepositEntityResponse extends CommonDepositEntity {
    from: string,
    to: string,
    currency: CurrencyEntity,
    bank: BankEntity
}