import { ChartPeriod } from "@/shared/utilities/formatters/dateFormatter";
import { SecurityHistoryPeriod } from "@/models/securities/SecurityHistoryPeriod";

export interface PeriodOption {
    id: ChartPeriod;
    labelKey: string;
    period: SecurityHistoryPeriod;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
    { id: "1D", labelKey: "security_history_period_1d", period: SecurityHistoryPeriod.Day1 },
    { id: "1W", labelKey: "security_history_period_1w", period: SecurityHistoryPeriod.Week1 },
    { id: "1M", labelKey: "security_history_period_1m", period: SecurityHistoryPeriod.Month1 },
    { id: "3M", labelKey: "security_history_period_3m", period: SecurityHistoryPeriod.Month3 },
    { id: "6M", labelKey: "security_history_period_6m", period: SecurityHistoryPeriod.Month6 },
    { id: "1Y", labelKey: "security_history_period_1y", period: SecurityHistoryPeriod.Year1 },
    { id: "5Y", labelKey: "security_history_period_5y", period: SecurityHistoryPeriod.Year5 },
    { id: "10Y", labelKey: "security_history_period_10y", period: SecurityHistoryPeriod.Year10 },
];

export interface HistoryStats {
    startPrice: number;
    endPrice: number;
    diff: number;
    diffPercent: number;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    isPositive: boolean;
}
