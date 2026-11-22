import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import {
    createAccount,
    deleteAccount,
    getAccounts,
    transferBalance,
    updateAccount,
} from '@/api/accounts/accountApi';
import { queryKeys } from '@/shared/constants/queryKeys';
import { Transfer } from '@/pages/Accounts/modals/AccountBalanceTransferModal/AccountBalanceTransferModal';

const filterActiveAccounts = (accounts: AccountEntity[]): AccountEntity[] => {
    return accounts.filter((account) => account.active);
};

export const useAccounts = () => {
    return useQuery({
        queryKey: queryKeys.accounts.all,
        queryFn: () => getAccounts({ onlyActive: false }),
    });
};

export const useActiveAccounts = () => {
    return useQuery({
        queryKey: queryKeys.accounts.all,
        queryFn: () => getAccounts({ onlyActive: false }),
        select: filterActiveAccounts,
    });
};

export const useCreateAccountMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newAccount: AccountEntity) => createAccount(newAccount),
        onSuccess: (createdId) => {
            if (createdId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
            }
        },
    });
};

export const useUpdateAccountMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (modifiedAccount: AccountEntity) => updateAccount(modifiedAccount),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
            }
        },
    });
};

export const useDeleteAccountMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (accountId: string) => deleteAccount(accountId),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
            }
        },
    });
};

export const useTransferBalanceMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transfer: Transfer) => transferBalance(transfer),
        onSuccess: (isSuccess) => {
            if (isSuccess) {
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
            }
        },
    });
};
