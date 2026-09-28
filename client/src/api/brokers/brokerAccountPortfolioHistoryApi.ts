import { BrokerAccountPortfolioHistoryEntity } from '@/models/brokers/BrokerAccountPortfolioHistoryEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { getEntity } from '@/api/basicApi';

const basicUrl = `BrokerAccountPortfolioHistory`;

export const getBrokerAccountPortfolioHistory = async (
    brokerAccountId: Nullable<string> = null,
    date: string
): Promise<BrokerAccountPortfolioHistoryEntity | void> => {
    const url = brokerAccountId
        ? `${basicUrl}/GetByBrokerAccount?date=${date}&brokerAccountId=${brokerAccountId}`
        : `${basicUrl}/GetAll?date=${date}`;

    return await getEntity<BrokerAccountPortfolioHistoryEntity>(url);
};
