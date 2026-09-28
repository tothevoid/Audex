import { AccountEntity, AccountEntityResponse } from "@/models/accounts/AccountEntity";

interface CommonCurrencyTransactionEntity {
	id: string,
	name: string,
	rate: number,
	amount: number
}

export interface CurrencyTransactionEntityRequest extends CommonCurrencyTransactionEntity {
	date: string,
	sourceAccountId: string,
	destinationAccountId: string
}

export interface CurrencyTransactionEntity extends CommonCurrencyTransactionEntity {
	date: Date,
	sourceAccount: AccountEntity,
	destinationAccount: AccountEntity
}

export interface CurrencyTransactionEntityResponse extends CommonCurrencyTransactionEntity {
	date: string,
	sourceAccount: AccountEntityResponse,
	destinationAccount: AccountEntityResponse
}

