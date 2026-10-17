import { BaseWidgetSettings } from "@/models/dashboard/WidgetEntity";

export interface BrokerPnlWidgetRequest {
    dashboardId: string;
    widgetId: string;
    brokerAccountId?: string | null;
}

export interface BrokerPnlWidgetEntity {
    dailyAbsoluteChange: number;
    dailyPercentageChange: number;
    totalAbsolutePnl: number;
    totalPercentagePnl: number;
    currencyName: string;
    selectedAccountName?: string | null;
    fetchedAt: string;
}

export interface BrokerPnlWidgetSettings extends BaseWidgetSettings {
    brokerAccountId?: string | null;
}
