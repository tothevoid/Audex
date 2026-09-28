import { CryptoAccountStatsEntity } from '@/models/crypto/CryptoAccountStatsEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { getEntity } from '@/api/basicApi';

const basicUrl = `CryptoAccountStats`;

export const getCryptoAccountStats = async (cryptoAccountId: Nullable<string> = null): Promise<CryptoAccountStatsEntity | null> => {
    const url = cryptoAccountId
        ? `${basicUrl}/GetStatsByCryptoAccount?cryptoAccountId=${cryptoAccountId}`
        : `${basicUrl}/GetStats`;
    return await getEntity<CryptoAccountStatsEntity>(url) ?? null;
};
