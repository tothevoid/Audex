import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CryptocurrencyEntity } from "@/models/crypto/CryptocurrencyEntity";
import { createCryptocurrency, deleteCryptocurrency, getCryptocurrencies, updateCryptocurrency } from "@/api/crypto/cryptocurrencyApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useCryptocurrencies = () => {
    const { t } = useTranslation();
    const [cryptocurrencies, setCryptocurrencies] = useState<CryptocurrencyEntity[]>([]);
    const [isCryptocurrenciesLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setCryptocurrencies(await getCryptocurrencies());
        } catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createCryptocurrencyEntity = async (createdCryptocurrency: CryptocurrencyEntity, icon: File | null) => {
        const createResult = await createCryptocurrency(createdCryptocurrency, icon);
        if (!createResult) {
            return;
        }

        setCryptocurrencies([createResult, ...cryptocurrencies]);
    };

    const updateCryptocurrencyEntity = async (updatedCryptocurrency: CryptocurrencyEntity, icon: File | null) => {
        const updateResult = await updateCryptocurrency(updatedCryptocurrency, icon);
        if (!updateResult) {
            return;
        }
    
        await fetchData();
    };

    const deleteCryptocurrencyEntity = async (deletedCryptocurrency: CryptocurrencyEntity) => {
        const isCryptocurrencyDeleted = await deleteCryptocurrency(deletedCryptocurrency.id);
        if (!isCryptocurrencyDeleted) {
            return;
        }

        await fetchData();
    };

    return {
        cryptocurrencies,
        isCryptocurrenciesLoading,
        error,
        createCryptocurrencyEntity,
        updateCryptocurrencyEntity,
        deleteCryptocurrencyEntity,
        reloadCryptocurrencies: fetchData
    };
};
