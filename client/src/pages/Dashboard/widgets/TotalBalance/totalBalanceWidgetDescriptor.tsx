import { MdAccountBalanceWallet } from "react-icons/md";
import { DashboardWidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor } from "../types";
import { TotalBalanceWidget } from "./TotalBalanceWidget";

export const totalBalanceWidgetDescriptor: WidgetDescriptor = {
    type: DashboardWidgetType.TotalBalance,
    template: {
        type: DashboardWidgetType.TotalBalance,
        titleKey: "widget_total_balance_title",
        descKey: "widget_total_balance_desc",
        icon: <MdAccountBalanceWallet size={20} />,
        defaultW: 6,
        defaultH: 4,
        minW: 4,
        minH: 3,
        defaultInterval: 0,
        isAvailable: true
    },
    component: TotalBalanceWidget,
    getDefaultSettings: () => ({})
};
