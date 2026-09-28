import { Nullable } from '@/shared/utilities/nullable';

export interface UserRefreshTokenEntity {
    id: string;
    createdByIp: Nullable<string>;
    userAgent: Nullable<string>;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
    isRevoked: boolean;
    isUsed: boolean;
}
