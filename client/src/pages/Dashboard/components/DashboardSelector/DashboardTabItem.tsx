import React from "react";
import { Badge, Box, HStack, Icon, Text } from "@chakra-ui/react";
import { MdDashboard } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { UserDashboardEntity } from "@/models/dashboard/UserDashboardEntity";
import { DashboardActionsMenu } from "./DashboardActionsMenu";

interface DashboardTabItemProps {
    dashboard: UserDashboardEntity;
    isActive: boolean;
    canDelete: boolean;
    onSelect: () => void;
    onRename: () => void;
    onSetDefault: () => void;
    onDelete: () => void;
}

export const DashboardTabItem: React.FC<DashboardTabItemProps> = ({
    dashboard,
    isActive,
    canDelete,
    onSelect,
    onRename,
    onSetDefault,
    onDelete
}) => {
    const { t } = useTranslation();

    return (
        <Box
            display="flex"
            alignItems="center"
            px={2.5}
            py={1}
            borderRadius="md"
            bg={isActive ? "background_secondary" : "transparent"}
            borderWidth="1px"
            borderColor={isActive ? "action_primary" : "border_primary"}
            cursor="pointer"
            transition="all 0.15s ease"
            onClick={onSelect}
            _hover={{
                bg: "background_secondary",
                borderColor: isActive ? "action_primary" : "border_primary"
            }}
        >
            <HStack gap={1.5} align="center">
                <Icon
                    color={isActive ? "action_primary" : "text_secondary"}
                    fontSize="0.95rem"
                >
                    <MdDashboard />
                </Icon>
                <Text
                    fontWeight={isActive ? "bold" : "medium"}
                    fontSize="sm"
                    color={isActive ? "text_primary" : "text_secondary"}
                >
                    {dashboard.title}
                </Text>
                {dashboard.isDefault && (
                    <Badge
                        size="xs"
                        colorPalette="blue"
                        variant="subtle"
                        title={t("dashboard_default_badge")}
                    >
                        ★
                    </Badge>
                )}
                <DashboardActionsMenu
                    dashboard={dashboard}
                    canDelete={canDelete}
                    onRename={onRename}
                    onSetDefault={onSetDefault}
                    onDelete={onDelete}
                />
            </HStack>
        </Box>
    );
};
