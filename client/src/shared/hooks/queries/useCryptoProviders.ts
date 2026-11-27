import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CryptoProviderEntity } from '@/models/crypto/CryptoProviderEntity';
import { Nullable } from '@/shared/utilities/nullable';
import {
    createCryptoProvider,
    deleteCryptoProvider,
    getCryptoProviders,
    updateCryptoProvider,
} from '@/api/crypto/cryptoProviderApi';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useCryptoProviders = () => {
    return useQuery({
        queryKey: queryKeys.cryptoProviders.all,
        queryFn: getCryptoProviders,
        staleTime: 10 * 60 * 1000,
    });
};

interface SaveCryptoProviderPayload {
    cryptoProvider: CryptoProviderEntity;
    icon: Nullable<File>;
}

export const useCreateCryptoProviderMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cryptoProvider, icon }: SaveCryptoProviderPayload) =>
            createCryptoProvider(cryptoProvider, icon),
        onSuccess: (createdProvider) => {
            if (createdProvider) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cryptoProviders.all });
            }
        },
    });
};

export const useUpdateCryptoProviderMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cryptoProvider, icon }: SaveCryptoProviderPayload) =>
            updateCryptoProvider(cryptoProvider, icon),
        onSuccess: (updatedProvider) => {
            if (updatedProvider) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cryptoProviders.all });
            }
        },
    });
};

export const useDeleteCryptoProviderMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cryptoProviderId: string) => deleteCryptoProvider(cryptoProviderId),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.cryptoProviders.all });
            }
        },
    });
};
