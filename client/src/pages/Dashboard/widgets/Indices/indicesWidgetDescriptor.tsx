import { LuTrendingUp } from "react-icons/lu";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor } from "../types";
import { IndicesWidget } from "./IndicesWidget";
import { IndicesSettings } from "./IndicesSettings";
import { IndicesWidgetSettings } from "@/models/dashboard/widgets/indices/IndicesWidgetEntity";

export const indicesWidgetDescriptor: WidgetDescriptor<IndicesWidgetSettings> = {
    type: DashboardWidgetType.Indices,
    template: {
        type: DashboardWidgetType.Indices,
        titleKey: "widget_indices_title",
        descKey: "widget_indices_desc",
        icon: <LuTrendingUp />,
        defaultW: 6,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 60,
        isAvailable: true
    },
    component: IndicesWidget,
    settingsComponent: IndicesSettings,
    getDefaultSettings: () => ({ codes: [] })
};
