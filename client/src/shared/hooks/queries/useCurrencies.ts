import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CurrencyEntity } from '@/models/currencies/CurrencyEntity';
import {
    createCurrency,
    deleteCurrency,
    getCurrencies,
    syncRates,
    updateCurrency,
} from '@/api/currencies/currencyApi';
import { queryKeys } from '@/shared/constants/queryKeys';

const transformCurrenciesToMap = (currencies: CurrencyEntity[]): Record<string, number> => {
    const currencyRateMap: Record<string, number> = {};
    for (const currency of currencies) {
        currencyRateMap[currency.id] = currency.rate;
    }
    return currencyRateMap;
};

export const useCurrencies = () => {
    return useQuery({
        queryKey: queryKeys.currencies.all,
        queryFn: getCurrencies,
    });
};

export const useCurrenciesMap = () => {
    return useQuery({
        queryKey: queryKeys.currencies.all,
        queryFn: getCurrencies,
        select: transformCurrenciesToMap,
    });
};

export const useCreateCurrencyMutation = () => {
    const currentQueryClient = useQueryClient();

    return useMutation({
        mutationFn: (newCurrency: CurrencyEntity) => createCurrency(newCurrency),
        onSuccess: (result) => {
            if (result.isSuccess) {
                currentQueryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
            }
        },
    });
};

export const useUpdateCurrencyMutation = () => {
    const currentQueryClient = useQueryClient();

    return useMutation({
        mutationFn: (modifiedCurrency: CurrencyEntity) => updateCurrency(modifiedCurrency),
        onSuccess: (result) => {
            if (result.isSuccess) {
                currentQueryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
            }
        },
    });
};

export const useDeleteCurrencyMutation = () => {
    const currentQueryClient = useQueryClient();

    return useMutation({
        mutationFn: (currencyId: string) => deleteCurrency(currencyId),
        onSuccess: () => {
            currentQueryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
        },
    });
};

export const useSyncCurrencyRatesMutation = () => {
    const currentQueryClient = useQueryClient();

    return useMutation({
        mutationFn: () => syncRates(),
        onSuccess: () => {
            currentQueryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
        },
    });
};
