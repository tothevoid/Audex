import { UserRefreshTokenEntity } from '@/models/auth/UserRefreshTokenEntity';
import { BasePageable } from '@/shared/models/BasePageable';
import { PagedResult } from '@/shared/models/PagedResult';
import { deleteAction, getPagedEntities, postAction } from '@/api/basicApi';

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
    return await deleteAction(`${basicUrl}/RefreshTokens/${id}`);
};

export const revokeOtherTokens = async (): Promise<boolean> => {
    return await postAction(`${basicUrl}/RevokeOthers`);
};
