import React, { useEffect, useState, forwardRef } from "react";
import { Box, Card } from "@chakra-ui/react";
import { WidgetConfig } from "@/models/dashboard/WidgetEntity";
import { WidgetHeader } from "./WidgetHeader";
import { getWidgetDescriptor, getWidgetIcon } from "../../widgets";

export interface WidgetContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    widget: WidgetConfig;
    dashboardId: string;
    isEditMode: boolean;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    onRemoveWidget: (widgetId: string) => void;
    onOpenSettings: (widget: WidgetConfig) => void;
}

export const WidgetContainer = forwardRef<HTMLDivElement, WidgetContainerProps>(({
    widget,
    dashboardId,
    isEditMode,
    icon,
    children,
    onRemoveWidget,
    onOpenSettings,
    style,
    className,
    ...restProps
}, ref) => {
    const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshSignal, setRefreshSignal] = useState(0);

    const triggerRefresh = () => {
        setIsRefreshing(true);
        setRefreshSignal(prev => prev + 1);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 600);
    };

    // Auto-polling interval
    useEffect(() => {
        if (!widget.refreshIntervalSeconds || widget.refreshIntervalSeconds <= 0) {
            return;
        }

        const intervalId = setInterval(() => {
            triggerRefresh();
        }, widget.refreshIntervalSeconds * 1000);

        return () => clearInterval(intervalId);
    }, [widget.refreshIntervalSeconds]);

    const handleFetched = React.useCallback((date: Date) => {
        setLastFetchedAt(date);
    }, []);

    const resolvedIcon = icon ?? getWidgetIcon(widget.type);
    const descriptor = getWidgetDescriptor(widget.type);

    const renderWidgetContent = () => {
        if (!descriptor) {
            return null;
        }

        const Component = descriptor.component;
        return (
            <Component
                widget={widget}
                dashboardId={dashboardId}
                refreshSignal={refreshSignal}
                onFetched={handleFetched}
            />
        );
    };

    return (
        <Box
            ref={ref}
            style={style}
            className={className}
            h="100%"
            w="100%"
            position="relative"
            display="flex"
            flexDirection="column"
            {...restProps}
        >
            <Card.Root
                h="100%"
                w="100%"
                display="flex"
                flexDirection="column"
                backgroundColor="background_primary"
                borderColor={isEditMode ? "action_primary" : "border_primary"}
                borderWidth="1px"
                borderStyle={isEditMode ? "dashed" : "solid"}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
                transition="border-color 0.2s ease, box-shadow 0.2s ease"
                _hover={{
                    boxShadow: isEditMode ? "md" : "sm",
                    borderColor: isEditMode ? "action_primary" : "border_primary"
                }}
            >
                <WidgetHeader
                    widget={widget}
                    lastFetchedAt={lastFetchedAt}
                    isRefreshing={isRefreshing}
                    isEditMode={isEditMode}
                    icon={resolvedIcon}
                    onRefresh={triggerRefresh}
                    onOpenSettings={() => onOpenSettings(widget)}
                    onRemove={() => onRemoveWidget(widget.id)}
                />
                <Box
                    flex="1"
                    p={3}
                    overflowY="auto"
                    overflowX="hidden"
                    display="flex"
                    flexDirection="column"
                    color="text_primary"
                >
                    {renderWidgetContent()}
                </Box>
            </Card.Root>
            {/* Render any resize handles cloned by react-grid-layout */}
            {children}
        </Box>
    );
});

WidgetContainer.displayName = "WidgetContainer";
