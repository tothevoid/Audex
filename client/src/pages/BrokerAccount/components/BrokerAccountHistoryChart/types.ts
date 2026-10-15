import { ChartPeriod } from "@/models/common/ChartPeriod";

export const PORTFOLIO_CHART_PERIODS: readonly ChartPeriod[] = [
    ChartPeriod.Month1,
    ChartPeriod.Month6,
    ChartPeriod.Year1,
    ChartPeriod.All,
] as const;
