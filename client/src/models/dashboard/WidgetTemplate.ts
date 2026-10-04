import React from "react";
import { v4 as uuidv4 } from "uuid";
import { WidgetConfig, WidgetType } from "./WidgetEntity";

export interface WidgetTemplate {
    type: WidgetType;
    titleKey: string;
    descKey: string;
    icon?: React.ReactNode;
    defaultW: number;
    defaultH: number;
    minW: number;
    minH: number;
    defaultInterval: number;
    isAvailable: boolean;
}

export const createDefaultWidgetFromTemplate = (
    template: WidgetTemplate,
    title: string,
    yPosition: number = Infinity
): WidgetConfig => ({
    id: `widget-${uuidv4()}`,
    type: template.type,
    title,
    refreshIntervalSeconds: template.defaultInterval,
    grid: {
        x: 0,
        y: yPosition,
        w: template.defaultW,
        h: template.defaultH,
        minW: template.minW,
        minH: template.minH
    },
    settings: {}
});
