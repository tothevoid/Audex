import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BankEntity } from '@/models/banks/BankEntity';
import { Nullable } from '@/shared/utilities/nullable';
import {
    createBank,
    deleteBank,
    getBanks,
    updateBank,
} from '@/api/banks/bankApi';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useBanks = () => {
    return useQuery({
        queryKey: queryKeys.banks.all,
        queryFn: getBanks,
    });
};

interface SaveBankPayload {
    bank: BankEntity;
    icon: Nullable<File>;
}

export const useCreateBankMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bank, icon }: SaveBankPayload) => createBank(bank, icon),
        onSuccess: (createdBank) => {
            if (createdBank) {
                queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
            }
        },
    });
};

export const useUpdateBankMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bank, icon }: SaveBankPayload) => updateBank(bank, icon),
        onSuccess: (updatedBank) => {
            if (updatedBank) {
                queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
            }
        },
    });
};

export const useDeleteBankMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bankId: string) => deleteBank(bankId),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
            }
        },
    });
};
