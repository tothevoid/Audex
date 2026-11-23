import { useQuery } from '@tanstack/react-query';
import { getAccountTypes } from '@/api/accounts/accountTypeApi';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useAccountTypes = () => {
    return useQuery({
        queryKey: queryKeys.accountTypes.all,
        queryFn: getAccountTypes,
        staleTime: 10 * 60 * 1000,
    });
};
