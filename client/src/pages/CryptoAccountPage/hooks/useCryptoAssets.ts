import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CryptoAssetEntity } from "@/models/crypto/CryptoAssetEntity";
import { createCryptoAsset, deleteCryptoAsset, updateCryptoAsset, getCryptoAssetsByCryptoAccount, getTotalBalance } from "@/api/crypto/cryptoAssetApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export const useCryptoAssets = (cryptoAccountId: string) => {
	const { t } = useTranslation();
	const [cryptoAssets, setCryptoAssets] = useState<CryptoAssetEntity[]>([]);
	const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadCryptoAssets = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const [assets, balance] = await Promise.all([
					getCryptoAssetsByCryptoAccount(cryptoAccountId),
					getTotalBalance(cryptoAccountId)
				]);
				if (isMounted) {
					setCryptoAssets(assets);
					setTotalBalanceUsd(balance);
					setError(null);
				}
			} catch (error: unknown) {
				if (isMounted) {
					setError(parseErrorMessage(error, t("error_data_load")));
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		load();

		return () => {
			isMounted = false;
		};
	}, [cryptoAccountId, refreshTrigger, t]);

	const addCryptoAssetEntity = async (cryptoAsset: CryptoAssetEntity) => {
		await createCryptoAsset(cryptoAsset);
		const name = cryptoAsset.cryptocurrency?.name ?? "";
		reloadCryptoAssets();
		notify.success(t("crypto_asset_toast_created_title"), t("crypto_asset_toast_created_desc", { name }));
	};

	const updateCryptoAssetEntity = async (cryptoAsset: CryptoAssetEntity) => {
		await updateCryptoAsset(cryptoAsset);
		const name = cryptoAsset.cryptocurrency?.name ?? "";
		reloadCryptoAssets();
		notify.success(t("crypto_asset_toast_updated_title"), t("crypto_asset_toast_updated_desc", { name }));
	};

	const deleteCryptoAssetEntity = async (deletedCryptoAsset: CryptoAssetEntity) => {
		const name = deletedCryptoAsset.cryptocurrency?.name ?? "";
		await deleteCryptoAsset(deletedCryptoAsset.id);
		reloadCryptoAssets();
		notify.success(t("crypto_asset_toast_deleted_title"), t("crypto_asset_toast_deleted_desc", { name }));
	};

	return {
		cryptoAssets,
		totalBalanceUsd,
		addCryptoAssetEntity,
		updateCryptoAssetEntity,
		deleteCryptoAssetEntity,
		isLoading,
		error,
		reloadCryptoAssets
	};
};
