import { LuTrendingUp } from "react-icons/lu";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor } from "../types";
import { SecuritiesDailyWidget } from "./SecuritiesDailyWidget";

export const securitiesDailyWidgetDescriptor: WidgetDescriptor<Record<string, unknown>> = {
    type: DashboardWidgetType.SecuritiesDaily,
    template: {
        type: DashboardWidgetType.SecuritiesDaily,
        titleKey: "widget_securities_daily_title",
        descKey: "widget_securities_daily_desc",
        icon: <LuTrendingUp />,
        defaultW: 6,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 60,
        isAvailable: true,
        isStatic: false
    },
    component: SecuritiesDailyWidget,
    getDefaultSettings: () => ({})
};
