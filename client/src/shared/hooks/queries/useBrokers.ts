import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrokerEntity } from '@/models/brokers/BrokerEntity';
import {
    createBroker,
    deleteBroker,
    getBrokers,
    updateBroker,
} from '@/api/brokers/brokerApi';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useBrokers = () => {
    return useQuery({
        queryKey: queryKeys.brokers.all,
        queryFn: getBrokers,
        staleTime: 10 * 60 * 1000,
    });
};

export const useCreateBrokerMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newBroker: BrokerEntity) => createBroker(newBroker),
        onSuccess: (createdBroker) => {
            if (createdBroker) {
                queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
            }
        },
    });
};

export const useUpdateBrokerMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updatedBroker: BrokerEntity) => updateBroker(updatedBroker),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
            }
        },
    });
};

export const useDeleteBrokerMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (brokerId: string) => deleteBroker(brokerId),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.brokers.all });
            }
        },
    });
};
