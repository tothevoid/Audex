import React from "react";
import { v4 as uuidv4 } from "uuid";
import { normalizeWidgetGrid, WidgetConfig, WidgetType } from "./WidgetEntity";

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
    isStatic: boolean;
}

export const createDefaultWidgetFromTemplate = (
    template: WidgetTemplate,
    title: string,
    yPosition: number = 0,
    defaultSettings: Record<string, unknown> = {}
): WidgetConfig => ({
    id: `widget-${uuidv4()}`,
    type: template.type,
    title,
    refreshIntervalSeconds: template.defaultInterval,
    grid: normalizeWidgetGrid({
        x: 0,
        y: yPosition,
        w: template.defaultW,
        h: template.defaultH,
        minW: template.minW,
        minH: template.minH
    }, yPosition),
    settings: defaultSettings
});
