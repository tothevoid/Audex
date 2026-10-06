export enum DashboardWidgetType {
    Oil = 'Oil',
    CurrencyRates = 'CurrencyRates',
    SecuritiesDaily = 'SecuritiesDaily'
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

export const DEFAULT_WIDGET_GRID: WidgetGridPosition = {
    x: 0,
    y: 0,
    w: 6,
    h: 3,
    minW: 3,
    minH: 3
};

export const normalizeWidgetGrid = (
    grid?: Partial<WidgetGridPosition>,
    defaultY: number = 0
): WidgetGridPosition => ({
    x: Number.isFinite(grid?.x) ? (grid!.x as number) : 0,
    y: Number.isFinite(grid?.y) ? (grid!.y as number) : defaultY,
    w: Number.isFinite(grid?.w) && (grid!.w as number) > 0 ? (grid!.w as number) : DEFAULT_WIDGET_GRID.w,
    h: Number.isFinite(grid?.h) && (grid!.h as number) > 0 ? (grid!.h as number) : DEFAULT_WIDGET_GRID.h,
    minW: Number.isFinite(grid?.minW) && (grid!.minW as number) > 0 ? (grid!.minW as number) : DEFAULT_WIDGET_GRID.minW,
    minH: Number.isFinite(grid?.minH) && (grid!.minH as number) > 0 ? (grid!.minH as number) : DEFAULT_WIDGET_GRID.minH,
    maxW: grid?.maxW,
    maxH: grid?.maxH
});

export interface WidgetConfig<TSettings = Record<string, unknown>> {
    id: string;
    type: WidgetType;
    title: string;
    refreshIntervalSeconds: number; // 0 = manual, 30, 60, 300, 900
    grid: WidgetGridPosition;
    settings: TSettings;
}
