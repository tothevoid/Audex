import { useCallback, useEffect, useState } from "react";
import { AccountEntity } from "../../../models/accounts/AccountEntity";
import { createAccount, getAccounts, updateAccount, deleteAccount } from "../../../api/accounts/accountApi";

export interface AccountsQuery {
	onlyActive: boolean;
	currencyId?: string | null;
	accountTypeId?: string | null;
}

export const useAccounts = (queryParameters: AccountsQuery) => {
	const [accounts, setAccounts] = useState<AccountEntity[]>([]);
	const [isAccountsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [accountQueryParameters, setAccountQueryParameters] = useState<AccountsQuery>(queryParameters);

	const fetchData = useCallback(async () => {
		setLoading(true)
		try {
			const accounts = await getAccounts(accountQueryParameters);
			setAccounts(accounts);
		} catch (err: any) {
			setError(err.message || 'Ошибка загрузки данных')
		} finally {
			setLoading(false)
		}
	}, [accountQueryParameters])

	useEffect(() => {
		fetchData();
	}, [fetchData])

	const createAccountEntity = async (account: AccountEntity) => {
		const createdAccountId = await createAccount(account);
		if (!createdAccountId) {
			return;
		}

		await fetchData();
	}

	const updateAccountEntity = async (updatedAccount: AccountEntity) => {
	   	if (!updatedAccount) {
			return;
		}

		const updated = await updateAccount(updatedAccount);
		if (!updated) {
			return;
		}

		await fetchData();
	}

	const deleteAccountEntity = async (deletedAccount: AccountEntity) => {
		if (!deletedAccount) {
			return;
		}

		const deleted = await deleteAccount(deletedAccount.id);
		if (!deleted) {
			return;
		}

		await fetchData();
	}

	return {
		accounts,
		isAccountsLoading,
		error,
		createAccountEntity,
		updateAccountEntity,
		deleteAccountEntity,
		setAccountQueryParameters: setAccountQueryParameters,
		accountQueryParameters: accountQueryParameters,
		reloadAccounts: fetchData
	}
}
