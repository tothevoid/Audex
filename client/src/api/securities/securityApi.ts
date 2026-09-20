import { SecurityHistory } from '../../models/securities/SecurityHistory';
import { SecurityHistoryPeriod } from '../../models/securities/SecurityHistoryPeriod';
import { createEntityWithIcon, deleteEntity, getAllEntities, getEntity, getEntityById, updateEntityWithIcon } from '../basicApi';
import { SecurityStats } from '../../models/securities/SecurityStats';
import { SecurityEntity, SecurityEntityRequest, SecurityEntityResponse, MarketSecurityInfoEntity } from '../../models/securities/SecurityEntity';
import { prepareSecurity, prepareSecurityEntityRequest } from './securityApiMapping';
import { Nullable } from '../../shared/utilities/nullable';
import { getStoredIconUrl } from '../iconApi';

const basicUrl = `Security`;
const ENTITY_NAME = "securityJson"
const ICON_NAME = "securityIcon"

export const getSecurities = async (): Promise<SecurityEntity[]> => {
    return await getAllEntities<SecurityEntityResponse>(basicUrl)
        .then(securityEntities => securityEntities.map(prepareSecurity));
};

export const getSecurityById = async (id: string): Promise<SecurityEntity | void> => {
    return await getEntityById<SecurityEntityResponse>(basicUrl, id)
        .then((response: SecurityEntityResponse | void) => response && prepareSecurity(response));
}

export const getSecurityStats = async (securityId: string): Promise<SecurityStats | void> => {
    return getEntity<SecurityStats>(`${basicUrl}/GetStats?securityId=${securityId}`);
}

export const getTickerHistory = async (
    ticker: string,
    period: SecurityHistoryPeriod = SecurityHistoryPeriod.Day1
): Promise<SecurityHistory | void> => {
    return getEntity<SecurityHistory>(
        `${basicUrl}/GetTickerHistory?ticker=${ticker}&period=${period}`
    );
};

export const createSecurity = async (addedSecurity: SecurityEntity, file: File | null): Promise<SecurityEntity | void> => {
    return await createEntityWithIcon<SecurityEntityRequest, SecurityEntityResponse>(basicUrl,
        prepareSecurityEntityRequest(addedSecurity), ENTITY_NAME, ICON_NAME, file)
        .then((securityResponse: SecurityEntityResponse | void) => securityResponse && prepareSecurity(securityResponse));
}

export const updateSecurity = async (modifiedSecurity: SecurityEntity, file: File | null): Promise<SecurityEntity | void> => {
    return await updateEntityWithIcon<SecurityEntityRequest, SecurityEntityResponse>(basicUrl, prepareSecurityEntityRequest(modifiedSecurity), ENTITY_NAME, ICON_NAME, file)
        .then((securityResponse: SecurityEntityResponse | void) => securityResponse && prepareSecurity(securityResponse));
}

export const deleteSecurity = async (securityId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, securityId);
}

export const searchMarketSecurity = async (query: string): Promise<MarketSecurityInfoEntity | null> => {
    return getEntity<MarketSecurityInfoEntity>(`${basicUrl}/SearchMarket?query=${encodeURIComponent(query)}`)
        .then(result => result ?? null);
}

export const getIconUrl = (iconKey: Nullable<string>): string => {
    if (!iconKey) {
        return "";
    }

    return getStoredIconUrl(basicUrl, iconKey);
}