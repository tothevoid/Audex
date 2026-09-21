import { SecurityHistory } from '../../models/securities/SecurityHistory';
import { SecurityHistoryPeriod } from '../../models/securities/SecurityHistoryPeriod';
import { 
    createEntityWithIconResult, 
    deleteEntity, 
    getAllEntities, 
    getEntity, 
    getEntityById, 
    updateEntityWithIconResult 
} from '../basicApi';
import { SecurityStats } from '../../models/securities/SecurityStats';
import { SecurityEntity, SecurityEntityResponse, MarketSecurityInfoEntity } from '../../models/securities/SecurityEntity';
import { prepareSecurity, prepareSecurityEntityRequest } from './securityApiMapping';
import { Nullable } from '../../shared/utilities/nullable';
import { getStoredIconUrl } from '../iconApi';
import { OperationResult } from '../../shared/models/OperationResult';

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

export const createSecurity = async (
    addedSecurity: SecurityEntity,
    file: File | null
): Promise<OperationResult<SecurityEntity>> => {
    return await createEntityWithIconResult(
        basicUrl,
        prepareSecurityEntityRequest(addedSecurity),
        ENTITY_NAME,
        ICON_NAME,
        file,
        prepareSecurity
    );
};

export const updateSecurity = async (
    modifiedSecurity: SecurityEntity,
    file: File | null
): Promise<OperationResult<SecurityEntity>> => {
    return await updateEntityWithIconResult(
        basicUrl,
        prepareSecurityEntityRequest(modifiedSecurity),
        ENTITY_NAME,
        ICON_NAME,
        file,
        prepareSecurity
    );
};

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