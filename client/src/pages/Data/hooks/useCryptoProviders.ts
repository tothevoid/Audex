import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CryptoProviderEntity } from "@/models/crypto/CryptoProviderEntity";
import { createCryptoProvider, deleteCryptoProvider, getCryptoProviders, updateCryptoProvider } from "@/api/crypto/cryptoProviderApi";
import { Nullable } from "@/shared/utilities/nullable";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export const useCryptoProviders = () => {
    const { t } = useTranslation();
    const [cryptoProviders, setCryptoProviders] = useState<CryptoProviderEntity[]>([]);
    const [isCryptoProvidersLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const reloadCryptoProviders = useCallback(() => {
        setRefreshTrigger((previousTrigger) => previousTrigger + 1);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const providers = await getCryptoProviders();
                if (isMounted) {
                    setCryptoProviders(providers);
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

    const createCryptoProviderEntity = async (createdCryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => {
        const addedCryptoProvider = await createCryptoProvider(createdCryptoProvider, icon);
        if (!addedCryptoProvider) {
            return;
        }

        notify.success(t("crypto_provider_toast_created_title"), t("crypto_provider_toast_created_desc", { name: addedCryptoProvider.name }));
        reloadCryptoProviders();
    };

    const updateCryptoProviderEntity = async (updatedCryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => {
        const cryptoProviderUpdated = await updateCryptoProvider(updatedCryptoProvider, icon);
        if (!cryptoProviderUpdated) {
            return;
        }

        notify.success(t("crypto_provider_toast_updated_title"), t("crypto_provider_toast_updated_desc", { name: updatedCryptoProvider.name }));

        reloadCryptoProviders();
    };

    const deleteCryptoProviderEntity = async (deletedCryptoProvider: CryptoProviderEntity) => {
        const cryptoProviderDeleted = await deleteCryptoProvider(deletedCryptoProvider.id);

        if (!cryptoProviderDeleted) {
            return;
        }

        notify.success(t("crypto_provider_toast_deleted_title"), t("crypto_provider_toast_deleted_desc", { name: deletedCryptoProvider.name }));

        const updatedCryptoProviders = cryptoProviders
            .filter((cryptoProvider: CryptoProviderEntity) => cryptoProvider.id !== deletedCryptoProvider.id);
        setCryptoProviders(updatedCryptoProviders);
    };

    return {
        cryptoProviders,
        isCryptoProvidersLoading,
        error,
        createCryptoProviderEntity,
        updateCryptoProviderEntity,
        deleteCryptoProviderEntity,
        reloadCryptoProviders,
        refetch: reloadCryptoProviders
    };
};
