import { BsDropletHalf } from "react-icons/bs";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor } from "../types";
import { OilWidget } from "./OilWidget";
import { OilSettings } from "./OilSettings";
import { OilWidgetSettings } from "@/models/dashboard/widgets/oil/OilWidgetEntity";

export const oilWidgetDescriptor: WidgetDescriptor<OilWidgetSettings> = {
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
        isAvailable: true
    },
    component: OilWidget,
    settingsComponent: OilSettings,
    getDefaultSettings: () => ({ symbols: [] })
};
