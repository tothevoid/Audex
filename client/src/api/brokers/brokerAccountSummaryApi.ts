import { BrokerAccountDailyStatsEntity } from '../../models/brokers/BrokerAccountDailyStatsEntity';
import { BrokerAccountMonthTransfersHistoryEntity } from '../../models/brokers/BrokerAccountMonthTransfersHistoryEntity';
import { BrokerAccountYearTransfersHistoryEntity } from '../../models/brokers/BrokerAccountYearTransfersHistoryEntity';
import { BrokerAccountPortfolioEntity } from '../../models/brokers/BrokerAccountPortfolioEntity';
import { BrokerAccountSummaryEntity } from '../../models/brokers/BrokerAccountSummaryEntity';
import { BrokerAccountTransfersAvailableDatesEntity } from '../../models/brokers/BrokerAccountTransfersAvailableDatesEntity';
import { Nullable } from '../../shared/utilities/nullable';
import { getEntity } from '../basicApi';
import { prepareBrokerAccountsSecurityStats, prepareDailyStats } from './brokerAccountSummaryApiMapping';

const basicUrl = `BrokerAccountSummary`;

export const getBrokerAccountStats = async (brokerAccountId: Nullable<string>): Promise<BrokerAccountSummaryEntity | void> => {
    const url = brokerAccountId ?
        `${basicUrl}/GetSummaryByBrokerAccount?brokerAccountId=${brokerAccountId}`:
        `${basicUrl}/GetSummary`;

    return getEntity<BrokerAccountSummaryEntity>(url)
        .then((data: BrokerAccountSummaryEntity | void) => data && prepareBrokerAccountsSecurityStats(data));
}

export const getMonthTransfersHistory = async (brokerAccountId: Nullable<string>, month: number, year: number): Promise<BrokerAccountMonthTransfersHistoryEntity | void> => {
    const url = brokerAccountId ? 
        `${basicUrl}/GetMonthTransfersHistoryByBrokerAccount?brokerAccountId=${brokerAccountId}&month=${month}&year=${year}` :
        `${basicUrl}/GetMonthTransfersHistory?month=${month}&year=${year}`;
    return await getEntity<BrokerAccountMonthTransfersHistoryEntity>(url);
}

export const getYearTransfersHistory = async (brokerAccountId: Nullable<string>, year: number): Promise<BrokerAccountYearTransfersHistoryEntity | void> => {
    const url = brokerAccountId ? 
        `${basicUrl}/GetYearTransfersHistoryByBrokerAccount?brokerAccountId=${brokerAccountId}&year=${year}` :
        `${basicUrl}/GetYearTransfersHistory?year=${year}`;
    return await getEntity<BrokerAccountYearTransfersHistoryEntity>(url);
}

export const getDailyStats = async (brokerAccountId: Nullable<string>): Promise<BrokerAccountDailyStatsEntity | void> => {
    const url = brokerAccountId ?
        `${basicUrl}/GetDailyStatsByBrokerAccount?brokerAccountId=${brokerAccountId}`:
        `${basicUrl}/GetDailyStats`;

    return await getEntity<BrokerAccountDailyStatsEntity>(url)
        .then((data: BrokerAccountDailyStatsEntity | void) => data && prepareDailyStats(data));
}

export const getPortfolioValues = async (brokerAccountId: Nullable<string> = null): Promise<BrokerAccountPortfolioEntity | void> => {
    const url = brokerAccountId ?
        `${basicUrl}/GetPortfolioValuesByBrokerAccount?brokerAccountId=${brokerAccountId}`:
        `${basicUrl}/GetPortfolioValues`;

    return await getEntity<BrokerAccountPortfolioEntity>(url)
        .then((data: BrokerAccountPortfolioEntity | void) => data);
}

export const getTransfersAvailableDates = async (brokerAccountId: Nullable<string> = null): Promise<BrokerAccountTransfersAvailableDatesEntity | void> => {
    const url = brokerAccountId ?
        `${basicUrl}/GetTransfersAvailableDates?brokerAccountId=${brokerAccountId}`:
        `${basicUrl}/GetTransfersAvailableDates`;

    return await getEntity<BrokerAccountTransfersAvailableDatesEntity>(url);
}