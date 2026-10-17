import React from "react";
import { FiTrendingUp } from "react-icons/fi";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetComponentProps, WidgetDescriptor, WidgetSettingsProps } from "../types";
import { BrokerPnlWidget } from "./BrokerPnlWidget";
import { BrokerPnlSettings } from "./BrokerPnlSettings";
import { BrokerPnlWidgetSettings } from "./types";

export const brokerPnlWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.BrokerPnl,
    template: {
        type: DashboardWidgetType.BrokerPnl,
        titleKey: "widget_broker_pnl_title",
        descKey: "widget_broker_pnl_desc",
        icon: <FiTrendingUp />,
        defaultW: 6,
        defaultH: 2,
        minW: 3,
        minH: 2,
        defaultInterval: 60,
        isAvailable: true,
        isStatic: false
    },
    component: BrokerPnlWidget as React.ComponentType<WidgetComponentProps>,
    settingsComponent: BrokerPnlSettings as React.ComponentType<WidgetSettingsProps>,
    getDefaultSettings: (): BrokerPnlWidgetSettings => ({
        brokerAccountId: null
    })
};
