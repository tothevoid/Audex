import React from "react";
import { Button, Icon, Menu } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MdMoreVert, MdEdit, MdStar, MdDeleteOutline } from "react-icons/md";
import { UserDashboardEntity } from "@/models/dashboard/UserDashboardEntity";

interface DashboardActionsMenuProps {
    dashboard: UserDashboardEntity;
    canDelete: boolean;
    onRename: () => void;
    onSetDefault: () => void;
    onDelete: () => void;
}

export const DashboardActionsMenu: React.FC<DashboardActionsMenuProps> = ({
    dashboard,
    canDelete,
    onRename,
    onSetDefault,
    onDelete
}) => {
    const { t } = useTranslation();

    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <Button
                    size="xs"
                    variant="ghost"
                    color="text_secondary"
                    px={1}
                    minW="20px"
                    h="20px"
                    _hover={{ color: "text_primary", bg: "background_primary" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Icon fontSize="0.95rem">
                        <MdMoreVert />
                    </Icon>
                </Button>
            </Menu.Trigger>
            <Menu.Positioner>
                <Menu.Content
                    bg="background_primary"
                    borderColor="border_primary"
                    color="text_primary"
                    shadow="lg"
                >
                    <Menu.Item
                        value="rename"
                        onClick={onRename}
                    >
                        <Icon mr={2}><MdEdit /></Icon>
                        {t("dashboard_rename")}
                    </Menu.Item>
                    {!dashboard.isDefault && (
                        <Menu.Item
                            value="set-default"
                            onClick={onSetDefault}
                        >
                            <Icon mr={2}><MdStar /></Icon>
                            {t("dashboard_set_as_default")}
                        </Menu.Item>
                    )}
                    {canDelete && (
                        <Menu.Item
                            value="delete"
                            color="status_expense"
                            onClick={onDelete}
                        >
                            <Icon mr={2}><MdDeleteOutline /></Icon>
                            {t("dashboard_delete")}
                        </Menu.Item>
                    )}
                </Menu.Content>
            </Menu.Positioner>
        </Menu.Root>
    );
};
