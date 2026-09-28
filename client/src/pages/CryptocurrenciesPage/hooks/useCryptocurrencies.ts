import { useCallback, useEffect, useState } from "react";
import { CryptocurrencyEntity } from "@/models/crypto/CryptocurrencyEntity";
import { createCryptocurrency, deleteCryptocurrency, getCryptocurrencies, updateCryptocurrency } from "@/api/crypto/cryptocurrencyApi";

export const useCryptocurrencies = () => {
    const [cryptocurrencies, setCryptocurrencies] = useState<CryptocurrencyEntity[]>([]);
    const [isCryptocurrenciesLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setCryptocurrencies(await getCryptocurrencies());
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, []);

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
