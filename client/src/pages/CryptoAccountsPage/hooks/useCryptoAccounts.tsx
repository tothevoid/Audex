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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setCryptoAccounts(await getCryptoAccounts());
        } catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
        } finally {
            setLoading(false);
        }
    }, [t]);

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
