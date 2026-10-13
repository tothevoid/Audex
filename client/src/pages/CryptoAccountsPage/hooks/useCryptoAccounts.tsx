import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CryptoAccountEntity } from "@/models/crypto/CryptoAccountEntity";
import { createCryptoAccount, deleteCryptoAccount, getCryptoAccounts, updateCryptoAccount } from "@/api/crypto/cryptoAccountApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useCryptoAccounts = () => {
    const { t } = useTranslation();
    const [cryptoAccounts, setCryptoAccounts] = useState<CryptoAccountEntity[]>([]);
    const [isCryptoAccountsLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadCryptoAccounts = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const accounts = await getCryptoAccounts();
				if (isMounted) {
					setCryptoAccounts(accounts);
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
	}, [refreshTrigger, t]);

	const createCryptoAccountEntity = async (createdCryptoAccount: CryptoAccountEntity) => {
		const addedCryptoAccount = await createCryptoAccount(createdCryptoAccount);
		if (!addedCryptoAccount) {
			return;
		}

		reloadCryptoAccounts();
	};

	const updateCryptoAccountEntity = async (updatedCryptoAccount: CryptoAccountEntity) => {
		const cryptoAccountUpdated = await updateCryptoAccount(updatedCryptoAccount);
		if (!cryptoAccountUpdated) {
			return;
		}

		reloadCryptoAccounts();
	};

	const deleteCryptoAccountEntity = async (deletedCryptoAccount: CryptoAccountEntity) => {
		const cryptoAccountDeleted = await deleteCryptoAccount(deletedCryptoAccount.id);
		if (!cryptoAccountDeleted) {
			return;
		}

		reloadCryptoAccounts();
	};

	return {
		cryptoAccounts,
		isCryptoAccountsLoading,
		error,
		createCryptoAccountEntity,
		updateCryptoAccountEntity,
		deleteCryptoAccountEntity,
		reloadCryptoAccounts
	};
};
