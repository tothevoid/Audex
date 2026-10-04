import React, { useRef, useState } from "react";
import { Button, HStack, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MdAdd } from "react-icons/md";
import { UserDashboardEntity } from "@/models/dashboard/UserDashboardEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { ConfirmModal } from "@/shared/modals/ConfirmModal/ConfirmModal";
import { DashboardTabItem } from "./DashboardTabItem";
import { DashboardTitleModal, DashboardTitleModalRef } from "./DashboardTitleModal";

interface DashboardSelectorProps {
    dashboards: UserDashboardEntity[];
    activeDashboardId: string | null;
    onSelectDashboard: (dashboardId: string) => void;
    onCreateDashboard: (title: string) => void;
    onRenameDashboard: (dashboardId: string, newTitle: string) => void;
    onSetDefaultDashboard: (dashboardId: string) => void;
    onDeleteDashboard: (dashboardId: string) => void;
}

export const DashboardSelector: React.FC<DashboardSelectorProps> = ({
    dashboards,
    activeDashboardId,
    onSelectDashboard,
    onCreateDashboard,
    onRenameDashboard,
    onSetDefaultDashboard,
    onDeleteDashboard
}) => {
    const { t } = useTranslation();

    const createModalRef = useRef<DashboardTitleModalRef>(null);
    const renameModalRef = useRef<DashboardTitleModalRef>(null);
    const deleteConfirmRef = useRef<BaseModalRef>(null);

    const [targetDashboardId, setTargetDashboardId] = useState<string | null>(null);

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0];

    const handleOpenRename = (dashboard: UserDashboardEntity) => {
        setTargetDashboardId(dashboard.id);
        renameModalRef.current?.openWithTitle(dashboard.title);
    };

    const handleOpenDelete = (dashboardId: string) => {
        setTargetDashboardId(dashboardId);
        deleteConfirmRef.current?.openModal();
    };

    const handleDeleteConfirmed = async () => {
        if (!targetDashboardId) return;
        onDeleteDashboard(targetDashboardId);
        setTargetDashboardId(null);
    };

    return (
        <HStack gap={2} align="center" flexWrap="wrap">
            {/* Dashboard Tabs with integrated actions menu */}
            <HStack gap={1.5} overflowX="auto" py={1}>
                {dashboards.map(dashboard => (
                    <DashboardTabItem
                        key={dashboard.id}
                        dashboard={dashboard}
                        isActive={dashboard.id === activeDashboard?.id}
                        canDelete={dashboards.length > 1}
                        onSelect={() => onSelectDashboard(dashboard.id)}
                        onRename={() => handleOpenRename(dashboard)}
                        onSetDefault={() => onSetDefaultDashboard(dashboard.id)}
                        onDelete={() => handleOpenDelete(dashboard.id)}
                    />
                ))}
            </HStack>

            {/* Create New Dashboard Button */}
            <Button
                size="sm"
                variant="outline"
                borderColor="border_primary"
                color="text_primary"
                onClick={() => createModalRef.current?.openWithTitle("")}
                title={t("dashboard_create_new")}
                px={2.5}
            >
                <Icon fontSize="1rem">
                    <MdAdd />
                </Icon>
                <Text display={{ base: "none", md: "inline" }}>
                    {t("dashboard_create_new")}
                </Text>
            </Button>

            {/* Create Modal */}
            <DashboardTitleModal
                ref={createModalRef}
                title={t("dashboard_create_title")}
                onSave={onCreateDashboard}
            />

            {/* Rename Modal */}
            <DashboardTitleModal
                ref={renameModalRef}
                title={t("dashboard_rename_title")}
                onSave={(newTitle) => {
                    if (targetDashboardId) {
                        onRenameDashboard(targetDashboardId, newTitle);
                    }
                }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                ref={deleteConfirmRef}
                title={t("dashboard_delete")}
                message={t("dashboard_delete_confirm")}
                confirmActionName={t("modals_delete_button")}
                onConfirmed={handleDeleteConfirmed}
            />
        </HStack>
    );
};
