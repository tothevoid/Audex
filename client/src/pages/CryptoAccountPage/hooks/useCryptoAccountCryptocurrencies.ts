import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CryptoAccountCryptocurrencyEntity } from "@/models/crypto/CryptoAccountCryptocurrencyEntity";
import { createCryptoAccountCryptocurrency, deleteCryptoAccountCryptocurrency, updateCryptoAccountCryptocurrency, getCryptocurrenciesByCryptoAccount, getTotalBalance } from "@/api/crypto/cryptoAccountCryptocurrencyApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export const useCryptoAccountCryptocurrencies = (cryptoAccountId: string) => {
	const { t } = useTranslation();
	const [cryptoAccountCryptocurrencies, setCryptoAccountCryptocurrencies] = useState<CryptoAccountCryptocurrencyEntity[]>([]);
	const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0);
	const [isCryptoAccountCryptocurrenciesLoading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadCryptoAccountCryptocurrencies = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const [cryptocurrencies, balance] = await Promise.all([
					getCryptocurrenciesByCryptoAccount(cryptoAccountId),
					getTotalBalance(cryptoAccountId)
				]);
				if (isMounted) {
					setCryptoAccountCryptocurrencies(cryptocurrencies);
					setTotalBalanceUsd(balance);
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
	}, [cryptoAccountId, refreshTrigger, t]);

	const addCryptoAccountCryptocurrencyEntity = async (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => {
		await createCryptoAccountCryptocurrency(cryptoAccountCryptocurrency);
		const name = cryptoAccountCryptocurrency.cryptocurrency?.name ?? "";
		reloadCryptoAccountCryptocurrencies();
		notify.success(t("crypto_position_toast_created_title"), t("crypto_position_toast_created_desc", { name }));
	};

	const updateCryptoAccountCryptocurrencyEntity = async (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => {
		await updateCryptoAccountCryptocurrency(cryptoAccountCryptocurrency);
		const name = cryptoAccountCryptocurrency.cryptocurrency?.name ?? "";
		reloadCryptoAccountCryptocurrencies();
		notify.success(t("crypto_position_toast_updated_title"), t("crypto_position_toast_updated_desc", { name }));
	};

	const deleteCryptoAccountCryptocurrencyEntity = async (deletedCryptoPosition: CryptoAccountCryptocurrencyEntity) => {
		const name = deletedCryptoPosition.cryptocurrency?.name ?? "";
		await deleteCryptoAccountCryptocurrency(deletedCryptoPosition.id);
		reloadCryptoAccountCryptocurrencies();
		notify.success(t("crypto_position_toast_deleted_title"), t("crypto_position_toast_deleted_desc", { name }));
	};

	return {
		cryptoAccountCryptocurrencies,
		totalBalanceUsd,
		addCryptoAccountCryptocurrencyEntity,
		updateCryptoAccountCryptocurrencyEntity,
		deleteCryptoAccountCryptocurrencyEntity,
		isCryptoAccountCryptocurrenciesLoading,
		error,
		reloadCryptoAccountCryptocurrencies
	};
};
