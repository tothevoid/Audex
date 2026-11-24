import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrokerAccountTypeEntity } from '@/models/brokers/BrokerAccountTypeEntity';
import {
    createBrokerAccountType,
    deleteBrokerAccountType,
    getBrokerAccountTypes,
    updateBrokerAccountType,
} from '@/api/brokers/brokerAccountTypeApi';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useBrokerAccountTypes = () => {
    return useQuery({
        queryKey: queryKeys.brokerAccountTypes.all,
        queryFn: getBrokerAccountTypes,
        staleTime: 10 * 60 * 1000,
    });
};

export const useCreateBrokerAccountTypeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newBrokerAccountType: BrokerAccountTypeEntity) =>
            createBrokerAccountType(newBrokerAccountType),
        onSuccess: (createdType) => {
            if (createdType) {
                queryClient.invalidateQueries({ queryKey: queryKeys.brokerAccountTypes.all });
            }
        },
    });
};

export const useUpdateBrokerAccountTypeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updatedBrokerAccountType: BrokerAccountTypeEntity) =>
            updateBrokerAccountType(updatedBrokerAccountType),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.brokerAccountTypes.all });
            }
        },
    });
};

export const useDeleteBrokerAccountTypeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (brokerAccountTypeId: string) =>
            deleteBrokerAccountType(brokerAccountTypeId),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.brokerAccountTypes.all });
            }
        },
    });
};
