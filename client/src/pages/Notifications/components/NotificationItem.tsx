import React from "react";
import {
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    Icon,
    IconButton,
    Stack,
    Text
} from "@chakra-ui/react";
import {
    MdCheck,
    MdCheckCircle,
    MdDeleteOutline,
    MdError,
    MdInfo,
    MdOpenInNew,
    MdWarning
} from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { NotificationEntity, NotificationSeverity } from "../../../models/notifications/NotificationEntity";
import { formatDateTime } from "../../../shared/utilities/formatters/dateFormatter";

interface NotificationItemProps {
    item: NotificationEntity;
    onMarkAsRead: (id: string, e?: React.MouseEvent) => void;
    onDelete: (id: string, e?: React.MouseEvent) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
    item,
    onMarkAsRead,
    onDelete
}) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const getSeverityIcon = (severity: NotificationSeverity) => {
        switch (severity) {
            case NotificationSeverity.Success:
                return <Icon color="green.400" fontSize="18px"><MdCheckCircle /></Icon>;
            case NotificationSeverity.Warning:
                return <Icon color="yellow.400" fontSize="18px"><MdWarning /></Icon>;
            case NotificationSeverity.Danger:
                return <Icon color="red.400" fontSize="18px"><MdError /></Icon>;
            case NotificationSeverity.Info:
            default:
                return <Icon color="blue.400" fontSize="18px"><MdInfo /></Icon>;
        }
    };

    const getSeverityBorderColor = (severity: NotificationSeverity, isRead: boolean) => {
        if (isRead) return "border_primary";
        switch (severity) {
            case NotificationSeverity.Success:
                return "green.500";
            case NotificationSeverity.Warning:
                return "yellow.500";
            case NotificationSeverity.Danger:
                return "red.500";
            case NotificationSeverity.Info:
            default:
                return "blue.500";
        }
    };

    return (
        <Box
            p={4}
            borderRadius="xl"
            backgroundColor={item.isRead ? "background_secondary" : "status_success_bg"}
            borderWidth="1px"
            borderLeftWidth="4px"
            borderLeftColor={getSeverityBorderColor(item.severity, item.isRead)}
            borderColor={item.isRead ? "border_primary" : "status_success_border"}
            transition="all 0.2s"
            _hover={{ borderColor: "action_primary", boxShadow: "md" }}
        >
            <Flex justify="space-between" align="flex-start" gap={3}>
                <HStack align="flex-start" gap={3} flex={1}>
                    <Box mt={1}>{getSeverityIcon(item.severity)}</Box>
                    <Stack gap={1} flex={1}>
                        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                            <HStack gap={2}>
                                <Text fontWeight={item.isRead ? "medium" : "bold"} fontSize="md" color="text_primary">
                                    {item.title}
                                </Text>
                                {item.category && (
                                    <Badge size="xs" variant="outline" borderColor="border_primary" color="text_secondary">
                                        {item.category}
                                    </Badge>
                                )}
                            </HStack>
                            <Text fontSize="xs" color="text_secondary">
                                {formatDateTime(item.createdAt, i18n)}
                            </Text>
                        </Flex>

                        <Text fontSize="sm" color="text_secondary" mt={1}>
                            {item.message}
                        </Text>
                    </Stack>
                </HStack>

                <HStack gap={1}>
                    {item.actionUrl && (
                        <Button
                            size="xs"
                            variant="outline"
                            borderColor="border_primary"
                            color="action_primary"
                            onClick={() => navigate(item.actionUrl!)}
                        >
                            <Icon mr={1}><MdOpenInNew /></Icon>
                            {t("notifications_go_to")}
                        </Button>
                    )}
                    {!item.isRead && (
                        <IconButton
                            aria-label={t("notifications_mark_as_read")}
                            size="xs"
                            variant="ghost"
                            color="text_secondary"
                            onClick={e => onMarkAsRead(item.id, e)}
                        >
                            <Icon><MdCheck /></Icon>
                        </IconButton>
                    )}
                    <IconButton
                        aria-label={t("notifications_delete")}
                        size="xs"
                        variant="ghost"
                        color="red.400"
                        onClick={e => onDelete(item.id, e)}
                    >
                        <Icon><MdDeleteOutline /></Icon>
                    </IconButton>
                </HStack>
            </Flex>
        </Box>
    );
};
