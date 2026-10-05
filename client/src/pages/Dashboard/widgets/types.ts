import React from "react";
import { WidgetConfig, WidgetType } from "@/models/dashboard/WidgetEntity";

export interface WidgetComponentProps<TSettings = Record<string, unknown>> {
    widget: WidgetConfig<TSettings>;
    dashboardId: string;
    refreshSignal?: number;
    onFetched?: (date: Date) => void;
}

export interface WidgetSettingsProps<TSettings = Record<string, unknown>> {
    settings: TSettings;
    updateSettings: (newSettings: Partial<TSettings>) => void;
    currentWidget: WidgetConfig<TSettings> | null;
}

export interface WidgetTemplateInfo {
    type: WidgetType;
    titleKey: string;
    descKey: string;
    icon: React.ReactNode;
    defaultW: number;
    defaultH: number;
    minW: number;
    minH: number;
    defaultInterval: number;
    isAvailable: boolean;
}

export interface WidgetDescriptor<TSettings = Record<string, unknown>> {
    type: WidgetType;
    template: WidgetTemplateInfo;
    component: React.ComponentType<WidgetComponentProps<TSettings>>;
    settingsComponent?: React.ComponentType<WidgetSettingsProps<TSettings>>;
    getDefaultSettings: () => TSettings;
}
