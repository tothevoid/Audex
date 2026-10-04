import React from "react";
import { Badge, Box, Button, Flex, HStack, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MdDragIndicator, MdRefresh } from "react-icons/md";
import { WidgetConfig } from "@/models/dashboard/WidgetEntity";
import { formatTimeWithSeconds } from "@/shared/utilities/formatters/dateFormatter";
import { CardActionButtons } from "@/shared/components/CardActionButtons/CardActionButtons";

interface WidgetHeaderProps {
    widget: WidgetConfig;
    lastFetchedAt: Date | null;
    isRefreshing: boolean;
    isEditMode: boolean;
    icon?: React.ReactNode;
    onRefresh: () => void;
    onOpenSettings: () => void;
    onRemove: () => void;
}

export const WidgetHeader: React.FC<WidgetHeaderProps> = ({
    widget,
    lastFetchedAt,
    isRefreshing,
    isEditMode,
    icon,
    onRefresh,
    onOpenSettings,
    onRemove
}) => {
    const { t, i18n } = useTranslation();

    const getIntervalLabel = (seconds: number): string => {
        if (!seconds || seconds <= 0) return t("widget_refresh_manual");
        if (seconds < 60) return `${seconds}s`;
        return `${Math.round(seconds / 60)}m`;
    };

    const formattedTime = lastFetchedAt ? formatTimeWithSeconds(lastFetchedAt, i18n) : "--:--:--";
    const tooltipText = `${t("dashboard_last_updated", { time: formattedTime })} • ${t("dashboard_auto_refresh", { interval: getIntervalLabel(widget.refreshIntervalSeconds) })}`;

    return (
        <Flex
            alignItems="center"
            justifyContent="space-between"
            px={3}
            py={2}
            borderBottom="1px solid"
            borderColor="border_primary"
            bg="background_secondary"
            borderTopRadius="md"
            className="widget-drag-handle"
            cursor={isEditMode ? "grab" : "default"}
            userSelect="none"
        >
            <HStack gap={2} align="center" overflow="hidden">
                {isEditMode && (
                    <Icon color="text_secondary" fontSize="1.1rem" cursor="grab">
                        <MdDragIndicator />
                    </Icon>
                )}
                {icon && (
                    <Box display="flex" alignItems="center" color="action_primary">
                        {icon}
                    </Box>
                )}
                <Text
                    fontWeight="semibold"
                    fontSize="sm"
                    color="text_primary"
                    truncate
                    maxW="180px"
                    title={widget.title}
                >
                    {widget.title}
                </Text>
            </HStack>

            <HStack gap={1} align="center">
                <Badge
                    variant="subtle"
                    size="sm"
                    colorPalette="gray"
                    fontSize="0.7rem"
                    px={1.5}
                    py={0.5}
                    borderRadius="md"
                    title={tooltipText}
                    cursor="help"
                >
                    {formattedTime}
                </Badge>

                <Button
                    size="xs"
                    variant="ghost"
                    color="text_secondary"
                    _hover={{ color: "text_primary", bg: "background_primary" }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRefresh();
                    }}
                    title={t("dashboard_refresh_all")}
                    disabled={isRefreshing}
                    px={1}
                    minW="24px"
                    h="24px"
                >
                    <Icon
                        fontSize="0.95rem"
                        animation={isRefreshing ? "spin 1s linear infinite" : undefined}
                    >
                        <MdRefresh />
                    </Icon>
                </Button>

                {isEditMode && (
                    <CardActionButtons
                        size="xs"
                        onSettings={onOpenSettings}
                        settingsTitle={t("widget_settings")}
                        onDelete={onRemove}
                        deleteTitle={t("widget_remove")}
                    />
                )}
            </HStack>
        </Flex>
    );
};
