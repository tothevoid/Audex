import React from "react";
import { DashboardWidgetType, WidgetType } from "@/models/dashboard/WidgetEntity";
import { WidgetDescriptor, WidgetTemplateInfo } from "./types";
import { oilWidgetDescriptor } from "./Oil";
import { securitiesDailyWidgetDescriptor } from "./SecuritiesDaily";

const activeDescriptors: Record<WidgetType, WidgetDescriptor<any>> = {
    [DashboardWidgetType.Oil]: oilWidgetDescriptor,
    [DashboardWidgetType.SecuritiesDaily]: securitiesDailyWidgetDescriptor
};

export const getWidgetDescriptor = (type: WidgetType): WidgetDescriptor<any> | undefined => {
    return activeDescriptors[type];
};

export const getAllWidgetTemplates = (): WidgetTemplateInfo[] => {
    return Object.values(activeDescriptors).map((descriptor) => descriptor.template);
};

export const getWidgetIcon = (type: WidgetType): React.ReactNode => {
    return activeDescriptors[type]?.template.icon;
};
