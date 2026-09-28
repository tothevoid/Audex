import { BrokerAccountSecurityEntity, BrokerAccountSecurityEntityResponse } from '@/models/brokers/BrokerAccountSecurityEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { getAction, getAllEntities, getEntity } from '@/api/basicApi';
import { prepareBrokerAccountSecurity } from './brokerAccountSecurityApiMapping';

const basicUrl = `BrokerAccountSecurity`;

export const getSecuritiesByBrokerAccount = async (brokerAccountId: Nullable<string>): Promise<BrokerAccountSecurityEntity[]> => {
    const query = brokerAccountId ?
        getAllEntities<BrokerAccountSecurityEntityResponse>(`${basicUrl}/GetByBrokerAccount?brokerAccountId=${brokerAccountId}`):
        getAllEntities<BrokerAccountSecurityEntityResponse>(`${basicUrl}/GetAll`);

    return await query
        .then((securities: BrokerAccountSecurityEntityResponse[]) => securities.map(prepareBrokerAccountSecurity))
};

export const pullBrokerAccountQuotations = async (brokerAccountId: Nullable<string> = null) => {
    const url = brokerAccountId ?
        `${basicUrl}/PullQuotationsByBrokerAccount?brokerAccountId=${brokerAccountId}`:
        `${basicUrl}/PullQuotations`;

    await getAction(url);
};

export const getLastPullDate = async (): Promise<Nullable<Date>> => {
    return getEntity<{lastPullDate: string}>(`${basicUrl}/GetLastPullDate`)
        .then((pullDateInfo) => pullDateInfo ? new Date(pullDateInfo.lastPullDate) : null);
};