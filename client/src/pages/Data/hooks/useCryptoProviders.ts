import { useCallback, useEffect, useState } from "react";
import { CryptoProviderEntity } from "@/models/crypto/CryptoProviderEntity";
import { createCryptoProvider, deleteCryptoProvider, getCryptoProviders, updateCryptoProvider } from "@/api/crypto/cryptoProviderApi";
import { Nullable } from "@/shared/utilities/nullable";

export const useCryptoProviders = () => {
    const [cryptoProviders, setCryptoProviders] = useState<CryptoProviderEntity[]>([]);
    const [isCryptoProvidersLoading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const providers = await getCryptoProviders();
            setCryptoProviders(providers);
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createCryptoProviderEntity = async (createdCryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => {
        const addedCryptoProvider = await createCryptoProvider(createdCryptoProvider, icon);
        if (!addedCryptoProvider) {
            return;
        }

        setCryptoProviders([addedCryptoProvider, ...cryptoProviders]);
    };

    const updateCryptoProviderEntity = async (updatedCryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => {
        const cryptoProviderUpdated = await updateCryptoProvider(updatedCryptoProvider, icon);
        if (!cryptoProviderUpdated) {
            return;
        }

        const updatedCryptoProviders = cryptoProviders.map((provider: CryptoProviderEntity) => 
            provider.id === updatedCryptoProvider.id ?
                cryptoProviderUpdated :
                provider
        );

        setCryptoProviders(updatedCryptoProviders);
    };

    const deleteCryptoProviderEntity = async (deletedCryptoProvider: CryptoProviderEntity) => {
        const cryptoProviderDeleted = await deleteCryptoProvider(deletedCryptoProvider.id);
    
        if (!cryptoProviderDeleted) {
            return;
        }

        const updatedCryptoProviders = cryptoProviders
            .filter((cryptoProvider: CryptoProviderEntity) => cryptoProvider.id !== deletedCryptoProvider.id)
        setCryptoProviders(updatedCryptoProviders)
    }

    return {
        cryptoProviders,
        isCryptoProvidersLoading,
        error,
        createCryptoProviderEntity,
        updateCryptoProviderEntity,
        deleteCryptoProviderEntity,
        refetch: fetchData
    }
}
