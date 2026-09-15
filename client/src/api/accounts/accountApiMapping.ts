import { AccountEntity, AccountEntityRequest, AccountEntityResponse } from "../../models/accounts/AccountEntity";
import { convertToDateOnly } from "../../shared/utilities/dateUtils";
import { prepareAccountType } from "./accountTypeApiMapping";

export const prepareAccountRequest = (account: AccountEntity): AccountEntityRequest => {
	const accountTypeId = typeof account.accountType === 'string' ? account.accountType : (account.accountType?.id ?? '');
	const currencyId = typeof account.currency === 'string' ? account.currency : (account.currency?.id ?? '');
	const bankId = typeof account.bank === 'string' ? account.bank : account.bank?.id;

	return {
		id: account.id,
		active: account.active,
		balance: account.balance,
		name: account.name,
		createdOn: convertToDateOnly(account.createdOn),
		accountTypeId,
		currencyId,
		bankId
	};
}

export const prepareAccount = (account: AccountEntityResponse): AccountEntity => {
	return {
		id: account.id,
		name: account.name,
		active: account.active,
		balance: account.balance,
		accountType: account.accountType ? prepareAccountType(account.accountType) : account.accountType,
		currency: account.currency,
		createdOn: new Date(account.createdOn),
		bank: account.bank
	};
}