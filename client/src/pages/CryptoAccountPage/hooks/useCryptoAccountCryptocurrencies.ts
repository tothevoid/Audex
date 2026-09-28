import { useCallback, useEffect, useState } from "react";
import { CryptoAccountCryptocurrencyEntity } from "@/models/crypto/CryptoAccountCryptocurrencyEntity";
import { createCryptoAccountCryptocurrency, deleteCryptoAccountCryptocurrency, updateCryptoAccountCryptocurrency, getCryptocurrenciesByCryptoAccount, getTotalBalance } from "@/api/crypto/cryptoAccountCryptocurrencyApi";

export interface CryptoAccountCryptocurrenciesQuery {
    cryptoAccountId: string
}

export const useCryptoAccountCryptocurrencies = (queryParameters: CryptoAccountCryptocurrenciesQuery) => {
    const [cryptoAccountCryptocurrencies, setCryptoAccountCryptocurrencies] = useState<CryptoAccountCryptocurrencyEntity[]>([]);
    const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0);
    const [isBrokerAccountSecuritiesLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [cryptoAccountCryptocurrenciesQueryParameters, setCryptoAccountCryptocurrenciesQueryParameters] = 
        useState<CryptoAccountCryptocurrenciesQuery>(queryParameters);

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [cryptocurrencies, balance] = await Promise.all([
                getCryptocurrenciesByCryptoAccount(cryptoAccountCryptocurrenciesQueryParameters.cryptoAccountId),
                getTotalBalance(cryptoAccountCryptocurrenciesQueryParameters.cryptoAccountId)
            ]);
            setCryptoAccountCryptocurrencies(cryptocurrencies);
            setTotalBalanceUsd(balance);
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки данных')
        } finally {
            setLoading(false)
        }
    }, [cryptoAccountCryptocurrenciesQueryParameters])

    useEffect(() => {
        fetchData();
    }, [fetchData])

    const addCryptoAccountCryptocurrencyEntity = async (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => {
        await createCryptoAccountCryptocurrency(cryptoAccountCryptocurrency);
        await fetchData();
    }

    const updateCryptoAccountCryptocurrencyEntity = async (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => {
        await updateCryptoAccountCryptocurrency(cryptoAccountCryptocurrency);
        await fetchData();
    }

    const deleteCryptoAccountCryptocurrencyEntity = async (id: string) => {
        await deleteCryptoAccountCryptocurrency(id);
        await fetchData();
    }

    return {
        cryptoAccountCryptocurrencies,
        totalBalanceUsd,
        addCryptoAccountCryptocurrencyEntity,
        updateCryptoAccountCryptocurrencyEntity,
        deleteCryptoAccountCryptocurrencyEntity,
        isBrokerAccountSecuritiesLoading,
        error,
        setCryptoAccountCryptocurrenciesQueryParameters,
        cryptoAccountCryptocurrenciesQueryParameters,
        reloadCryptoAccountCryptocurrencies: fetchData
    }
}
