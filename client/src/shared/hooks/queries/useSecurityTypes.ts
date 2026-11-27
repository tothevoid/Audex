import { useQuery } from '@tanstack/react-query';
import { getSecurityTypes } from '@/api/securities/securityTypeApi';
import { queryKeys } from '@/shared/constants/queryKeys';

export const useSecurityTypes = () => {
    return useQuery({
        queryKey: queryKeys.securityTypes.all,
        queryFn: getSecurityTypes,
        staleTime: 10 * 60 * 1000,
    });
};
