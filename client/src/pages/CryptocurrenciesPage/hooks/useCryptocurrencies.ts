import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CryptocurrencyEntity } from "@/models/crypto/CryptocurrencyEntity";
import { createCryptocurrency, deleteCryptocurrency, getCryptocurrencies, updateCryptocurrency } from "@/api/crypto/cryptocurrencyApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export const useCryptocurrencies = () => {
    const { t } = useTranslation();
    const [cryptocurrencies, setCryptocurrencies] = useState<CryptocurrencyEntity[]>([]);
    const [isCryptocurrenciesLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadCryptocurrencies = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const currencies = await getCryptocurrencies();
				if (isMounted) {
					setCryptocurrencies(currencies);
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

	const createCryptocurrencyEntity = async (createdCryptocurrency: CryptocurrencyEntity, icon: File | null) => {
		const createResult = await createCryptocurrency(createdCryptocurrency, icon);
		if (!createResult) {
			return;
		}

		reloadCryptocurrencies();
		notify.success(t("crypto_toast_created_title"), t("crypto_toast_created_desc", { name: createResult.name }));
	};

	const updateCryptocurrencyEntity = async (updatedCryptocurrency: CryptocurrencyEntity, icon: File | null) => {
		const updateResult = await updateCryptocurrency(updatedCryptocurrency, icon);
		if (!updateResult) {
			return;
		}

		reloadCryptocurrencies();
		notify.success(t("crypto_toast_updated_title"), t("crypto_toast_updated_desc", { name: updatedCryptocurrency.name }));
	};

	const deleteCryptocurrencyEntity = async (deletedCryptocurrency: CryptocurrencyEntity) => {
		const isCryptocurrencyDeleted = await deleteCryptocurrency(deletedCryptocurrency.id);
		if (!isCryptocurrencyDeleted) {
			return;
		}

		reloadCryptocurrencies();
		notify.success(t("crypto_toast_deleted_title"), t("crypto_toast_deleted_desc", { name: deletedCryptocurrency.name }));
	};

	return {
		cryptocurrencies,
		isCryptocurrenciesLoading,
		error,
		createCryptocurrencyEntity,
		updateCryptocurrencyEntity,
		deleteCryptocurrencyEntity,
		reloadCryptocurrencies
	};
};
