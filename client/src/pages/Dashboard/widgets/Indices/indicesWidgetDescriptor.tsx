import React from "react";
import { LuTrendingUp } from "react-icons/lu";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetComponentProps, WidgetDescriptor, WidgetSettingsProps } from "../types";
import { IndicesWidget } from "./IndicesWidget";
import { IndicesSettings } from "./IndicesSettings";

export const indicesWidgetDescriptor: WidgetDescriptor = {
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
        isAvailable: true,
        isStatic: false
    },
    component: IndicesWidget as React.ComponentType<WidgetComponentProps>,
    settingsComponent: IndicesSettings as React.ComponentType<WidgetSettingsProps>,
    getDefaultSettings: () => ({ codes: [] })
};
