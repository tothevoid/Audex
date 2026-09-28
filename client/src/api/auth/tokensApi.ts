import { UserRefreshTokenEntity } from '@/models/auth/UserRefreshTokenEntity';
import { BasePageable } from '@/shared/models/BasePageable';
import { PagedResult } from '@/shared/models/PagedResult';
import { getPagedEntities } from '@/api/basicApi';
import httpClient from '@/api/httpClient';
import { logPromiseError } from '@/shared/utilities/webApiUtilities';

const basicUrl = 'Auth';

export interface RefreshTokensQuery extends BasePageable {
    isOnlyActive: boolean;
}

export const getPagedRefreshTokens = async (
    query: RefreshTokensQuery
): Promise<PagedResult<UserRefreshTokenEntity>> => {
    return await getPagedEntities<RefreshTokensQuery, UserRefreshTokenEntity>(`${basicUrl}/RefreshTokens`, query);
};

export const revokeToken = async (id: string): Promise<boolean> => {
    const url = `${basicUrl}/RefreshTokens/${id}`;
    const result = await httpClient.delete(url)
        .then(() => true)
        .catch(logPromiseError);
    return result ?? false;
};

export const revokeOtherTokens = async (): Promise<boolean> => {
    const url = `${basicUrl}/RevokeOthers`;
    const result = await httpClient.post(url, {})
        .then(() => true)
        .catch(logPromiseError);
    return result ?? false;
};
