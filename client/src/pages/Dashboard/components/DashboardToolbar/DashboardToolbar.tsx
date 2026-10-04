import React from "react";
import { Button, Flex, HStack, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MdEdit, MdCheck } from "react-icons/md";
import { UserDashboardEntity } from "@/models/dashboard/UserDashboardEntity";
import { formatTimeWithSeconds } from "@/shared/utilities/formatters/dateFormatter";
import RefreshButton from "@/shared/components/RefreshButton/RefreshButton";
import AddButton from "@/shared/components/AddButton/AddButton";
import { DashboardSelector } from "../DashboardSelector/DashboardSelector";

interface DashboardToolbarProps {
    dashboards: UserDashboardEntity[];
    activeDashboardId: string | null;
    isEditMode: boolean;
    isRefreshingAll: boolean;
    lastGlobalRefreshAt: Date | null;
    onSelectDashboard: (dashboardId: string) => void;
    onCreateDashboard: (title: string) => void;
    onRenameDashboard: (dashboardId: string, newTitle: string) => void;
    onSetDefaultDashboard: (dashboardId: string) => void;
    onDeleteDashboard: (dashboardId: string) => void;
    onToggleEditMode: () => void;
    onOpenAddWidget: () => void;
    onRefreshAll: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
    dashboards,
    activeDashboardId,
    isEditMode,
    isRefreshingAll,
    lastGlobalRefreshAt,
    onSelectDashboard,
    onCreateDashboard,
    onRenameDashboard,
    onSetDefaultDashboard,
    onDeleteDashboard,
    onToggleEditMode,
    onOpenAddWidget,
    onRefreshAll
}) => {
    const { t, i18n } = useTranslation();

    const formattedGlobalTime = lastGlobalRefreshAt
        ? formatTimeWithSeconds(lastGlobalRefreshAt, i18n)
        : "--:--:--";

    return (
        <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={3}
            p={3}
            bg="background_primary"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border_primary"
            boxShadow="sm"
        >
            <DashboardSelector
                dashboards={dashboards}
                activeDashboardId={activeDashboardId}
                onSelectDashboard={onSelectDashboard}
                onCreateDashboard={onCreateDashboard}
                onRenameDashboard={onRenameDashboard}
                onSetDefaultDashboard={onSetDefaultDashboard}
                onDeleteDashboard={onDeleteDashboard}
            />

            <HStack gap={2} align="center">
                {isEditMode && (
                    <AddButton
                        size="sm"
                        buttonTitle={t("dashboard_add_widget")}
                        onClick={onOpenAddWidget}
                    />
                )}

                <Button
                    size="sm"
                    variant="outline"
                    borderColor={isEditMode ? "action_primary" : "border_primary"}
                    color={isEditMode ? "action_primary" : "text_primary"}
                    bg={isEditMode ? "background_secondary" : "transparent"}
                    onClick={onToggleEditMode}
                    px={3}
                    _hover={{
                        bg: "background_secondary",
                        borderColor: "action_primary"
                    }}
                >
                    <Icon fontSize="1rem">
                        {isEditMode ? <MdCheck /> : <MdEdit />}
                    </Icon>
                    <Text>
                        {isEditMode ? t("dashboard_view_mode") : t("dashboard_edit_mode")}
                    </Text>
                </Button>

                <RefreshButton
                    title={formattedGlobalTime}
                    showClockIcon={true}
                    isRefreshing={isRefreshingAll}
                    onClick={onRefreshAll}
                />
            </HStack>
        </Flex>
    );
};
