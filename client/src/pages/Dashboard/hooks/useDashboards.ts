import { useCallback, useEffect, useState } from "react";
import { Layout } from "react-grid-layout";
import { UserDashboardEntity } from "@/models/dashboard/UserDashboardEntity";
import { normalizeWidgetGrid, WidgetConfig } from "@/models/dashboard/WidgetEntity";
import {
    createUserDashboard,
    deleteUserDashboard,
    getAllUserDashboards,
    getDefaultUserDashboard,
    renameUserDashboard,
    setDefaultUserDashboard,
    updateUserDashboardLayout
} from "@/api/dashboard/userDashboardApi";

export const useDashboards = () => {
    const [dashboards, setDashboards] = useState<UserDashboardEntity[]>([]);
    const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);
    const [lastGlobalRefreshAt, setLastGlobalRefreshAt] = useState<Date | null>(new Date());

    // Load user dashboards
    const loadDashboards = useCallback(async () => {
        setIsLoading(true);
        try {
            let list = await getAllUserDashboards();
            if (list.length === 0) {
                const defaultDashboard = await getDefaultUserDashboard();
                if (defaultDashboard) {
                    list = [defaultDashboard];
                }
            }

            setDashboards(list);

            if (list.length > 0) {
                const defaultOrFirst = list.find(d => d.isDefault) || list[0];
                setActiveDashboardId(defaultOrFirst.id);

                try {
                    const parsedWidgets = defaultOrFirst.layoutJson
                        ? JSON.parse(defaultOrFirst.layoutJson)
                        : [];
                    setWidgets(parsedWidgets);
                } catch {
                    setWidgets([]);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboards();
    }, [loadDashboards]);

    // Handle switching dashboards
    const handleSelectDashboard = (dashboardId: string) => {
        setActiveDashboardId(dashboardId);
        const target = dashboards.find(d => d.id === dashboardId);
        if (target) {
            try {
                const parsedWidgets = target.layoutJson ? JSON.parse(target.layoutJson) : [];
                setWidgets(parsedWidgets);
            } catch {
                setWidgets([]);
            }
        }
    };

    // Save current widgets to backend
    const saveWidgetsToBackend = async (newWidgets: WidgetConfig[]) => {
        if (!activeDashboardId) return;

        const layoutJson = JSON.stringify(newWidgets);
        await updateUserDashboardLayout({
            id: activeDashboardId,
            layoutJson
        });

        // Update local dashboards state
        setDashboards(current =>
            current.map(d => (d.id === activeDashboardId ? { ...d, layoutJson } : d))
        );
    };

    // Handle layout reposition / resize from react-grid-layout
    const handleLayoutChange = (currentLayout: Layout) => {
        if (!isEditMode) return;

        setWidgets(currentWidgets => {
            const updated = currentWidgets.map(widget => {
                const layoutItem = currentLayout.find(item => item.i === widget.id);
                if (!layoutItem) return widget;

                return {
                    ...widget,
                    grid: {
                        ...widget.grid,
                        x: layoutItem.x,
                        y: layoutItem.y,
                        w: layoutItem.w,
                        h: layoutItem.h
                    }
                };
            });

            saveWidgetsToBackend(updated);
            return updated;
        });
    };

    // Create new dashboard
    const handleCreateDashboard = async (title: string) => {
        const created = await createUserDashboard({
            title,
            layoutJson: "[]"
        });

        if (created) {
            setDashboards(current => [...current, created]);
            setActiveDashboardId(created.id);
            setWidgets([]);
        }
    };

    // Rename dashboard
    const handleRenameDashboard = async (dashboardId: string, newTitle: string) => {
        const renamed = await renameUserDashboard({ id: dashboardId, title: newTitle });
        if (renamed) {
            setDashboards(current =>
                current.map(d => (d.id === dashboardId ? { ...d, title: newTitle } : d))
            );
        }
    };

    // Set default dashboard
    const handleSetDefaultDashboard = async (dashboardId: string) => {
        await setDefaultUserDashboard(dashboardId);
        setDashboards(current =>
            current.map(d => ({ ...d, isDefault: d.id === dashboardId }))
        );
    };

    // Delete dashboard
    const handleDeleteDashboard = async (dashboardId: string) => {
        await deleteUserDashboard(dashboardId);
        const remaining = dashboards.filter(d => d.id !== dashboardId);
        setDashboards(remaining);

        if (activeDashboardId === dashboardId && remaining.length > 0) {
            const nextDashboard = remaining[0];
            setActiveDashboardId(nextDashboard.id);
            try {
                setWidgets(nextDashboard.layoutJson ? JSON.parse(nextDashboard.layoutJson) : []);
            } catch {
                setWidgets([]);
            }
        }
    };

    // Save widget (either add new or update existing)
    const handleSaveWidgetSettings = (savedWidget: WidgetConfig) => {
        const exists = widgets.some(w => w.id === savedWidget.id);
        let updated: WidgetConfig[];

        if (exists) {
            updated = widgets.map(w => (w.id === savedWidget.id ? savedWidget : w));
        } else {
            const maxY = widgets.reduce(
                (max, w) => Math.max(max, normalizeWidgetGrid(w.grid).y + normalizeWidgetGrid(w.grid).h),
                0
            );
            const normalizedWidget: WidgetConfig = {
                ...savedWidget,
                grid: normalizeWidgetGrid(savedWidget.grid, maxY)
            };
            updated = [...widgets, normalizedWidget];
        }

        setWidgets(updated);
        saveWidgetsToBackend(updated);
    };

    // Remove widget
    const handleRemoveWidget = (widgetId: string) => {
        const updated = widgets.filter(w => w.id !== widgetId);
        setWidgets(updated);
        saveWidgetsToBackend(updated);
    };

    // Trigger global refresh for all widgets
    const handleRefreshAll = () => {
        setIsRefreshingAll(true);
        setTimeout(() => {
            setLastGlobalRefreshAt(new Date());
            setIsRefreshingAll(false);
        }, 700);
    };

    return {
        dashboards,
        activeDashboardId,
        widgets,
        isLoading,
        isEditMode,
        setIsEditMode,
        isRefreshingAll,
        lastGlobalRefreshAt,
        handleSelectDashboard,
        handleCreateDashboard,
        handleRenameDashboard,
        handleSetDefaultDashboard,
        handleDeleteDashboard,
        handleLayoutChange,
        handleSaveWidgetSettings,
        handleRemoveWidget,
        handleRefreshAll
    };
};
