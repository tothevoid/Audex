import React, { useRef } from "react";
import { Stack, Box, Spinner, Center } from "@chakra-ui/react";
import PageContainer from "@/shared/components/PageContainer/PageContainer";
import { WidgetConfig } from "@/models/dashboard/WidgetEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { DashboardToolbar } from "./components/DashboardToolbar/DashboardToolbar";
import { DashboardGrid } from "./components/DashboardGrid/DashboardGrid";
import { AddWidgetModal } from "./components/AddWidgetModal/AddWidgetModal";
import { BaseWidgetSettingsModal, BaseWidgetSettingsModalRef } from "./components/WidgetSettingsModal/BaseWidgetSettingsModal";
import { getWidgetDescriptor } from "./widgets";
import { useDashboards } from "./hooks/useDashboards";

export const WidgetsDashboardPage: React.FC = () => {
    const {
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
    } = useDashboards();

    const addWidgetModalRef = useRef<BaseModalRef>(null);
    const widgetSettingsModalRef = useRef<BaseWidgetSettingsModalRef>(null);

    const handleOpenWidgetSettings = (widget: WidgetConfig) => {
        widgetSettingsModalRef.current?.openWithWidget(widget);
    };

    const renderCustomSettings = (
        settings: Record<string, unknown>,
        updateSettings: (newSettings: Partial<Record<string, unknown>>) => void,
        currentWidget: WidgetConfig | null
    ) => {
        if (!currentWidget) return null;

        const descriptor = getWidgetDescriptor(currentWidget.type);
        if (!descriptor || !descriptor.settingsComponent) {
            return null;
        }

        const SettingsComponent = descriptor.settingsComponent;
        return (
            <SettingsComponent
                settings={settings}
                updateSettings={updateSettings}
                currentWidget={currentWidget}
            />
        );
    };

    if (isLoading) {
        return (
            <PageContainer>
                <Center minH="400px">
                    <Spinner size="xl" color="action_primary" />
                </Center>
            </PageContainer>
        );
    }

    return (
        <PageContainer color="text_primary">
            <Stack gap={4}>
                {/* Toolbar with Dashboard selector, Edit Mode toggle, Add Widget & Refresh */}
                <DashboardToolbar
                    dashboards={dashboards}
                    activeDashboardId={activeDashboardId}
                    isEditMode={isEditMode}
                    isRefreshingAll={isRefreshingAll}
                    lastGlobalRefreshAt={lastGlobalRefreshAt}
                    onSelectDashboard={handleSelectDashboard}
                    onCreateDashboard={handleCreateDashboard}
                    onRenameDashboard={handleRenameDashboard}
                    onSetDefaultDashboard={handleSetDefaultDashboard}
                    onDeleteDashboard={handleDeleteDashboard}
                    onToggleEditMode={() => setIsEditMode(!isEditMode)}
                    onOpenAddWidget={() => addWidgetModalRef.current?.openModal()}
                    onRefreshAll={handleRefreshAll}
                />

                {/* Grid Layout Container */}
                <Box minH="500px">
                    <DashboardGrid
                        widgets={widgets}
                        dashboardId={activeDashboardId ?? ""}
                        isEditMode={isEditMode}
                        onLayoutChange={handleLayoutChange}
                        onRemoveWidget={handleRemoveWidget}
                        onOpenSettings={handleOpenWidgetSettings}
                        onOpenAddWidget={() => addWidgetModalRef.current?.openModal()}
                    />
                </Box>
            </Stack>

            {/* Add Widget Modal */}
            <AddWidgetModal
                ref={addWidgetModalRef}
                onSelectWidget={handleOpenWidgetSettings}
            />

            {/* Widget Settings Modal */}
            <BaseWidgetSettingsModal
                ref={widgetSettingsModalRef}
                onSaveWidget={handleSaveWidgetSettings}
                renderCustomSettings={renderCustomSettings}
            />
        </PageContainer>
    );
};

export default WidgetsDashboardPage;
