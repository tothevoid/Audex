import { Nullable } from "@/shared/utilities/nullable";
import { BaseWidgetSettings } from "@/models/dashboard/WidgetEntity";

export interface MarketIndexQuoteResponse {
    code: string;
    name: string;
    shortName: string;
    value: number;
    changePoints: number;
    changePercent: number;
    currency: string;
    decimals: number;
    source: string;
    lastUpdateTime: Nullable<string>;
}

export interface IndicesWidgetResponse {
    indices: MarketIndexQuoteResponse[];
}

export interface MarketIndexQuoteEntity {
    code: string;
    name: string;
    shortName: string;
    value: number;
    changePoints: number;
    changePercent: number;
    currency: string;
    decimals: number;
    source: string;
    lastUpdateTime: Nullable<Date>;
}

export interface IndicesWidgetEntity {
    indices: MarketIndexQuoteEntity[];
}

export interface IndicesWidgetSettings extends BaseWidgetSettings {
    codes: string[];
}

export interface IndicesWidgetRequest {
    dashboardId: string;
    widgetId: string;
    codes: string[];
}
