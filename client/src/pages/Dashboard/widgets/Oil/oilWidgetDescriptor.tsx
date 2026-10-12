import React from "react";
import { BsDropletHalf } from "react-icons/bs";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetComponentProps, WidgetDescriptor, WidgetSettingsProps } from "../types";
import { OilWidget } from "./OilWidget";
import { OilSettings } from "./OilSettings";

export const oilWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.Oil,
    template: {
        type: DashboardWidgetType.Oil,
        titleKey: "widget_oil_title",
        descKey: "widget_oil_desc",
        icon: <BsDropletHalf />,
        defaultW: 6,
        defaultH: 3,
        minW: 3,
        minH: 3,
        defaultInterval: 60,
        isAvailable: true,
        isStatic: false
    },
    component: OilWidget as React.ComponentType<WidgetComponentProps>,
    settingsComponent: OilSettings as React.ComponentType<WidgetSettingsProps>,
    getDefaultSettings: () => ({ symbols: [] })
};
