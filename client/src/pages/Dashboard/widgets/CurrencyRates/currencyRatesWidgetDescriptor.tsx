import { BsCurrencyExchange } from "react-icons/bs";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor } from "../types";
import { CurrencyRatesWidget } from "./CurrencyRatesWidget";

export const currencyRatesWidgetDescriptor: WidgetDescriptor<Record<string, unknown>> = {
    type: DashboardWidgetType.CurrencyRates,
    template: {
        type: DashboardWidgetType.CurrencyRates,
        titleKey: "widget_currency_rates_title",
        descKey: "widget_currency_rates_desc",
        icon: <BsCurrencyExchange />,
        defaultW: 6,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 300,
        isAvailable: true
    },
    component: CurrencyRatesWidget,
    getDefaultSettings: () => ({})
};
