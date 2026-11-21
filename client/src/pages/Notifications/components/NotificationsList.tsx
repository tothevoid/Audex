import React from "react";
import { Box, Icon, Text, VStack } from "@chakra-ui/react";
import { MdNotifications } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { NotificationEntity } from "@/models/notifications/NotificationEntity";
import { NotificationItem } from "./NotificationItem";
import { useConfirm } from "@/shared/hooks/useConfirm";

interface NotificationsListProps {
    items: NotificationEntity[];
    isLoading: boolean;
    onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
    onDelete: (id: string) => Promise<void>;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
    items,
    isLoading,
    onMarkAsRead,
    onDelete
}) => {
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const handleDeleteClick = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const confirmed = await confirmDelete(
            t("notifications_delete_confirm_title"),
            t("notifications_delete_confirm_message"),
            t("notifications_delete")
        );
        if (!confirmed) {
            return;
        }

        await onDelete(id);
    };

    if (isLoading) {
        return (
            <Box p={12} textAlign="center" color="text_secondary">
                <Text>Загрузка...</Text>
            </Box>
        );
    }

    if (items.length === 0) {
        return (
            <Box
                p={12}
                textAlign="center"
                backgroundColor="background_secondary"
                borderColor="border_primary"
                borderWidth="1px"
                borderRadius="xl"
            >
                <Icon fontSize="48px" color="text_secondary" opacity={0.4} mb={3}>
                    <MdNotifications />
                </Icon>
                <Text fontSize="lg" fontWeight="semibold" color="text_primary">
                    {t("notifications_no_history")}
                </Text>
            </Box>
        );
    }

    return (
        <>
            <VStack gap={3} align="stretch">
                {items.map(item => (
                    <NotificationItem
                        key={item.id}
                        item={item}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={handleDeleteClick}
                    />
                ))}
            </VStack>
        </>
    );
};
