import { useCallback, useEffect, useState } from "react";
import { CryptoAccountEntity } from "@/models/crypto/CryptoAccountEntity";
import { createCryptoAccount, deleteCryptoAccount, getCryptoAccounts, updateCryptoAccount } from "@/api/crypto/cryptoAccountApi";

export const useCryptoAccounts = () => {
    const [cryptoAccounts, setCryptoAccounts] = useState<CryptoAccountEntity[]>([]);
    const [isCryptoAccountsLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setCryptoAccounts(await getCryptoAccounts());
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createCryptoAccountEntity = async (createdCryptoAccount: CryptoAccountEntity) => {
        const addedCryptoAccount = await createCryptoAccount(createdCryptoAccount);
        if (!addedCryptoAccount) {
            return;
        }

        await fetchData();
    };

    const updateCryptoAccountEntity = async (updatedCryptoAccount: CryptoAccountEntity) => {
        const cryptoAccountUpdated = await updateCryptoAccount(updatedCryptoAccount);
        if (!cryptoAccountUpdated) {
            return;
        }

        await fetchData();
    };

    const deleteCryptoAccountEntity = async (deletedCryptoAccount: CryptoAccountEntity) => {
        const cryptoAccountDeleted = await deleteCryptoAccount(deletedCryptoAccount.id);
        if (!cryptoAccountDeleted) {
            return;
        }

        await fetchData();
    };

    return {
        cryptoAccounts,
        isCryptoAccountsLoading,
        error,
        createCryptoAccountEntity,
        updateCryptoAccountEntity,
        deleteCryptoAccountEntity,
        reloadCryptoAccounts: fetchData
    };
};
