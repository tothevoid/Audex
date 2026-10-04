export enum DashboardWidgetType {
    OilCommodities = 'OilCommodities',
    CurrencyRates = 'CurrencyRates',
    Indices = 'Indices',
    Watchlist = 'Watchlist'
}

export type WidgetType = keyof typeof DashboardWidgetType;

export interface WidgetGridPosition {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
}

export interface WidgetConfig<TSettings = Record<string, unknown>> {
    id: string;
    type: WidgetType;
    title: string;
    refreshIntervalSeconds: number; // 0 = manual, 30, 60, 300, 900
    grid: WidgetGridPosition;
    settings: TSettings;
}
