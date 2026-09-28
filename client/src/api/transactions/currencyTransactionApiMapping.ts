import { CurrencyTransactionEntityResponse, CurrencyTransactionEntity, CurrencyTransactionEntityRequest } from "@/models/transactions/CurrencyTransactionEntity"
import { convertToDateOnly } from "@/shared/utilities/dateUtils"
import { prepareAccount } from "@/api/accounts/accountApiMapping"

export const prepareCurrencyTransactionRequest = (currencyTransaction: CurrencyTransactionEntity): CurrencyTransactionEntityRequest => {
	return {
		id: currencyTransaction.id,
		amount: currencyTransaction.amount,
		rate: currencyTransaction.rate,
		destinationAccountId: currencyTransaction.destinationAccount.id,
		sourceAccountId: currencyTransaction.sourceAccount.id,
		date: convertToDateOnly(currencyTransaction.date),
		name: currencyTransaction.name
	}
}

export const prepareCurrencyTransaction = (currencyTransaction: CurrencyTransactionEntityResponse): CurrencyTransactionEntity => {
	return {
		id: currencyTransaction.id,
		amount: currencyTransaction.amount,
		rate: currencyTransaction.rate,
		destinationAccount: prepareAccount(currencyTransaction.destinationAccount),
		sourceAccount: prepareAccount(currencyTransaction.sourceAccount),
		date: new Date(currencyTransaction.date),
		name: currencyTransaction.name
	}
}