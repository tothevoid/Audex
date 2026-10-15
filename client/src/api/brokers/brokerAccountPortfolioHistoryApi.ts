import { BrokerAccountPortfolioHistoryEntity } from '@/models/brokers/BrokerAccountPortfolioHistoryEntity';
import {
    BrokerAccountPortfolioDateBoundsEntity,
    BrokerAccountPortfolioDateBoundsEntityResponse,
} from '@/models/brokers/BrokerAccountPortfolioDateBoundsEntity';
import { BrokerAccountPortfolioTimelinePointEntity } from '@/models/brokers/BrokerAccountPortfolioTimelinePointEntity';
import { ChartPeriod } from '@/models/common/ChartPeriod';
import { Nullable } from '@/shared/utilities/nullable';
import { convertToDateOnly, parseIsoDateOnly } from '@/shared/utilities/dateUtils';
import { getEntity, getAllEntities } from '@/api/basicApi';

const basicUrl = `BrokerAccountPortfolioHistory`;

export const calculatePortfolioRangeStartDate = (
    endDate: Date | string,
    period: ChartPeriod,
    minDate?: Nullable<Date | string>
): Date => {
    const parsedEndDate = endDate instanceof Date ? endDate : new Date(endDate);
    const calculatedStartDate = new Date(parsedEndDate);
    const parsedMinDate = minDate ? (minDate instanceof Date ? minDate : new Date(minDate)) : null;

    switch (period) {
        case ChartPeriod.Month1:
            calculatedStartDate.setMonth(calculatedStartDate.getMonth() - 1);
            break;
        case ChartPeriod.Month6:
            calculatedStartDate.setMonth(calculatedStartDate.getMonth() - 6);
            break;
        case ChartPeriod.Year1:
            calculatedStartDate.setFullYear(calculatedStartDate.getFullYear() - 1);
            break;
        case ChartPeriod.All:
            if (parsedMinDate) {
                return new Date(parsedMinDate);
            }
            calculatedStartDate.setFullYear(calculatedStartDate.getFullYear() - 1);
            break;
    }

    if (parsedMinDate && calculatedStartDate < parsedMinDate) {
        return new Date(parsedMinDate);
    }

    return calculatedStartDate;
};

export const getBrokerAccountPortfolioHistory = async (
    brokerAccountId: Nullable<string> = null,
    date: Date | string
): Promise<BrokerAccountPortfolioHistoryEntity | void> => {
    const formattedDate = convertToDateOnly(date);
    const url = brokerAccountId
        ? `${basicUrl}/GetByBrokerAccount?date=${formattedDate}&brokerAccountId=${brokerAccountId}`
        : `${basicUrl}/GetAll?date=${formattedDate}`;

    return await getEntity<BrokerAccountPortfolioHistoryEntity>(url);
};

export const getBrokerAccountPortfolioDateBounds = async (
    brokerAccountId: Nullable<string> = null
): Promise<BrokerAccountPortfolioDateBoundsEntity | void> => {
    const url = brokerAccountId
        ? `${basicUrl}/GetDateBounds?brokerAccountId=${brokerAccountId}`
        : `${basicUrl}/GetDateBounds`;

    const response = await getEntity<BrokerAccountPortfolioDateBoundsEntityResponse>(url);
    if (!response) {
        return undefined;
    }

    return {
        minDate: parseIsoDateOnly(response.minDate),
        maxDate: parseIsoDateOnly(response.maxDate),
    };
};

export const getBrokerAccountPortfolioHistoryRange = async (
    startDate: Date | string,
    endDate: Date | string,
    brokerAccountId: Nullable<string> = null
): Promise<BrokerAccountPortfolioTimelinePointEntity[]> => {
    const formattedStartDate = convertToDateOnly(startDate);
    const formattedEndDate = convertToDateOnly(endDate);

    const url = brokerAccountId
        ? `${basicUrl}/GetRangeByBrokerAccount?startDate=${formattedStartDate}&endDate=${formattedEndDate}&brokerAccountId=${brokerAccountId}`
        : `${basicUrl}/GetRange?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;

    const result = await getAllEntities<BrokerAccountPortfolioTimelinePointEntity>(url);
    const points = result ?? [];

    return points;
};

export const getBrokerAccountPortfolioHistoryByPeriod = async (
    period: ChartPeriod,
    brokerAccountId: Nullable<string> = null,
    endDate?: Nullable<Date | string>,
    minDate?: Nullable<Date | string>
): Promise<BrokerAccountPortfolioTimelinePointEntity[]> => {
    const resolvedEndDate = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : new Date();
    const startDate = calculatePortfolioRangeStartDate(resolvedEndDate, period, minDate);

    return await getBrokerAccountPortfolioHistoryRange(
        startDate,
        resolvedEndDate,
        brokerAccountId
    );
};
