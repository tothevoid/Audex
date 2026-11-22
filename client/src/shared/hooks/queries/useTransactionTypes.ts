import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TransactionTypeEntity } from '@/models/transactions/TransactionTypeEntity';
import {
    createTransactionType,
    deleteTransactionType,
    getTransactionTypes,
    updateTransactionType,
} from '@/api/transactions/transactionTypeApi';
import { queryKeys } from '@/shared/constants/queryKeys';

const filterActiveTransactionTypes = (transactionTypes: TransactionTypeEntity[]): TransactionTypeEntity[] => {
    return transactionTypes.filter((transactionType) => transactionType.active);
};

export const useTransactionTypes = () => {
    return useQuery({
        queryKey: queryKeys.transactionTypes.all,
        queryFn: () => getTransactionTypes(false),
    });
};

export const useActiveTransactionTypes = () => {
    return useQuery({
        queryKey: queryKeys.transactionTypes.all,
        queryFn: () => getTransactionTypes(false),
        select: filterActiveTransactionTypes,
    });
};

interface SaveTransactionTypePayload {
    transactionType: TransactionTypeEntity;
    icon: File | null;
}

export const useCreateTransactionTypeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionType, icon }: SaveTransactionTypePayload) =>
            createTransactionType(transactionType, icon),
        onSuccess: (createdType) => {
            if (createdType) {
                queryClient.invalidateQueries({ queryKey: queryKeys.transactionTypes.all });
            }
        },
    });
};

export const useUpdateTransactionTypeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionType, icon }: SaveTransactionTypePayload) =>
            updateTransactionType(transactionType, icon),
        onSuccess: (updatedType) => {
            if (updatedType) {
                queryClient.invalidateQueries({ queryKey: queryKeys.transactionTypes.all });
            }
        },
    });
};

export const useDeleteTransactionTypeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transactionTypeId: string) => deleteTransactionType(transactionTypeId),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.transactionTypes.all });
            }
        },
    });
};
