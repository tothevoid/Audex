import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import { createAccount, getAccounts, updateAccount, deleteAccount } from "@/api/accounts/accountApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";
import { queryKeys } from "@/shared/constants/queryKeys";

export interface AccountsQuery {
	onlyActive: boolean;
	currencyId?: string | null;
	accountTypeId?: string | null;
}

export const useAccounts = (queryParameters: AccountsQuery) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [accounts, setAccounts] = useState<AccountEntity[]>([]);
	const [isAccountsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [accountQueryParameters, setAccountQueryParameters] = useState<AccountsQuery>(queryParameters);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadAccounts = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const fetchedAccounts = await getAccounts(accountQueryParameters);
				if (isMounted) {
					setAccounts(fetchedAccounts);
					setError(null);
				}
			} catch (error: unknown) {
				if (isMounted) {
					setError(parseErrorMessage(error, t("error_data_load")));
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		load();

		return () => {
			isMounted = false;
		};
	}, [accountQueryParameters, refreshTrigger, t]);

	const createAccountEntity = async (account: AccountEntity) => {
		const createdAccountId = await createAccount(account);
		if (!createdAccountId) {
			return;
		}

		queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
		reloadAccounts();
		notify.success(
			t("accounts_toast_created_title"),
			t("accounts_toast_created_desc", { name: account.name })
		);
	};

	const updateAccountEntity = async (updatedAccount: AccountEntity) => {
	   	if (!updatedAccount) {
			return;
		}

		const updated = await updateAccount(updatedAccount);
		if (!updated) {
			return;
		}

		queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
		reloadAccounts();
		notify.success(
			t("accounts_toast_updated_title"),
			t("accounts_toast_updated_desc", { name: updatedAccount.name })
		);
	};

	const deleteAccountEntity = async (deletedAccount: AccountEntity) => {
		if (!deletedAccount) {
			return;
		}

		const deleted = await deleteAccount(deletedAccount.id);
		if (!deleted) {
			return;
		}

		queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
		reloadAccounts();
		notify.success(
			t("accounts_toast_deleted_title"),
			t("accounts_toast_deleted_desc", { name: deletedAccount.name })
		);
	};

	return {
		accounts,
		isAccountsLoading,
		error,
		createAccountEntity,
		updateAccountEntity,
		deleteAccountEntity,
		setAccountQueryParameters,
		accountQueryParameters,
		reloadAccounts
	};
};
