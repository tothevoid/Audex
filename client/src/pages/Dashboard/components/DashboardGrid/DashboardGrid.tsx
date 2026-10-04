import React from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveGridLayout, useContainerWidth, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "./DashboardGrid.scss";
import { MdDashboardCustomize } from "react-icons/md";
import { WidgetConfig } from "@/models/dashboard/WidgetEntity";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import AddButton from "@/shared/components/AddButton/AddButton";
import { WidgetContainer } from "../WidgetContainer/WidgetContainer";

interface DashboardGridProps {
    widgets: WidgetConfig[];
    isEditMode: boolean;
    onLayoutChange: (layout: Layout) => void;
    onRemoveWidget: (widgetId: string) => void;
    onOpenSettings: (widget: WidgetConfig) => void;
    onOpenAddWidget: () => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
    widgets,
    isEditMode,
    onLayoutChange,
    onRemoveWidget,
    onOpenSettings,
    onOpenAddWidget
}) => {
    const { t } = useTranslation();
    const { width, containerRef: measuredRef } = useContainerWidth();

    if (widgets.length === 0) {
        return (
            <Placeholder
                text={t("dashboard_no_widgets")}
                icon={<MdDashboardCustomize />}
            >
                <AddButton
                    buttonTitle={t("dashboard_add_widget")}
                    onClick={onOpenAddWidget}
                />
            </Placeholder>
        );
    }

    const layouts = {
        lg: widgets.map(widget => ({
            i: widget.id,
            x: Number(widget.grid.x ?? 0),
            y: Number(widget.grid.y ?? 0),
            w: Number(widget.grid.w ?? 6),
            h: Number(widget.grid.h ?? 3),
            minW: Number(widget.grid.minW ?? 4),
            minH: Number(widget.grid.minH ?? 3)
        }))
    };

    const handleLayoutChange = (currentLayout: Layout) => {
        onLayoutChange(currentLayout);
    };

    return (
        <div ref={measuredRef} style={{ width: "100%", minHeight: "450px" }}>
            {width > 0 && (
                <ResponsiveGridLayout
                    width={width}
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={85}
                    dragConfig={{
                        enabled: isEditMode,
                        handle: ".widget-drag-handle"
                    }}
                    resizeConfig={{
                        enabled: isEditMode
                    }}
                    onLayoutChange={handleLayoutChange}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                >
                    {widgets.map(widget => (
                        <WidgetContainer
                            key={widget.id}
                            widget={widget}
                            isEditMode={isEditMode}
                            onRemoveWidget={onRemoveWidget}
                            onOpenSettings={onOpenSettings}
                        />
                    ))}
                </ResponsiveGridLayout>
            )}
        </div>
    );
};
