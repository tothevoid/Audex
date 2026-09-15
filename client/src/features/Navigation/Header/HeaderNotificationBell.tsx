import React, { useState } from "react";
import {
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    Icon,
    Popover,
    Stack,
    Text,
    VStack
} from "@chakra-ui/react";
import {
    MdNotifications,
    MdCheckCircle,
    MdInfo,
    MdWarning,
    MdError,
    MdDoneAll,
    MdOpenInNew
} from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../shared/hooks/useNotifications";
import { NotificationEntity, NotificationSeverity } from "../../../models/notifications/NotificationEntity";

export const HeaderNotificationBell: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, hasMore, isLoadingMore, loadMore } = useNotifications();
    const [open, setOpen] = useState(false);
    const [onlyUnreadFilter, setOnlyUnreadFilter] = useState(false);

    const getSeverityIcon = (severity: NotificationSeverity) => {
        switch (severity) {
            case NotificationSeverity.Success:
                return <Icon color="green.400"><MdCheckCircle /></Icon>;
            case NotificationSeverity.Warning:
                return <Icon color="yellow.400"><MdWarning /></Icon>;
            case NotificationSeverity.Danger:
                return <Icon color="red.400"><MdError /></Icon>;
            case NotificationSeverity.Info:
            default:
                return <Icon color="blue.400"><MdInfo /></Icon>;
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

    const formatTimeAgo = (date: Date | string) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return t("notifications_just_now");
        const diffMs = Date.now() - d.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 1) return t("notifications_just_now");
        if (diffMinutes < 60) return t("notifications_minutes_ago", { count: diffMinutes });
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return t("notifications_hours_ago", { count: diffHours });
        const diffDays = Math.floor(diffHours / 24);
        return t("notifications_days_ago", { count: diffDays });
    };

    const handleItemClick = (item: NotificationEntity) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }
        if (item.actionUrl) {
            setOpen(false);
            navigate(item.actionUrl);
        }
    };

    const filteredNotifications = onlyUnreadFilter
        ? notifications.filter(n => !n.isRead)
        : notifications;

    return (
        <Popover.Root open={open} onOpenChange={e => setOpen(e.open)} positioning={{ placement: "bottom-end" }}>
            <Popover.Trigger asChild>
                <Box position="relative" display="inline-block">
                    <Button
                        aria-label="Notifications"
                        size="md"
                        borderColor="background_secondary"
                        background="button_background_secondary"
                    >
                        <Icon color="card_action_icon_primary">
                            <MdNotifications />
                        </Icon>
                    </Button>
                    {unreadCount > 0 && (
                        <Badge
                            position="absolute"
                            top="-1"
                            right="-1"
                            background="red.500"
                            color="white"
                            borderRadius="full"
                            size="xs"
                            minW="18px"
                            height="18px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="10px"
                            fontWeight="bold"
                            pointerEvents="none"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Box>
            </Popover.Trigger>

            <Popover.Positioner>
                <Popover.Content
                    width="380px"
                    maxW="90vw"
                    backgroundColor="background_primary"
                    borderColor="border_primary"
                    borderRadius="xl"
                    boxShadow="0 8px 30px rgba(0, 0, 0, 0.5)"
                    p={0}
                    color="text_primary"
                    zIndex={1500}
                >
                    <Box p={3} borderBottomWidth="1px" borderColor="border_primary">
                        <Flex justify="space-between" align="center">
                            <HStack gap={2}>
                                <Text fontWeight="bold" fontSize="md">
                                    {t("notifications_title")}
                                </Text>
                                {unreadCount > 0 && (
                                    <Badge size="xs" background="action_primary" color="white" borderRadius="full">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </HStack>
                            {unreadCount > 0 && (
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    color="action_primary"
                                    onClick={markAllAsRead}
                                    gap={1}
                                    paddingX={2}
                                >
                                    <Icon><MdDoneAll /></Icon>
                                    {t("notifications_mark_all_as_read")}
                                </Button>
                            )}
                        </Flex>
                        <HStack mt={2} gap={2}>
                            <Button
                                size="xs"
                                variant={!onlyUnreadFilter ? "solid" : "ghost"}
                                background={!onlyUnreadFilter ? "action_primary" : "transparent"}
                                color="text_primary"
                                onClick={() => setOnlyUnreadFilter(false)}
                            >
                                {t("notifications_filter_recent")} ({notifications.length})
                            </Button>
                            <Button
                                size="xs"
                                variant={onlyUnreadFilter ? "solid" : "ghost"}
                                background={onlyUnreadFilter ? "action_primary" : "transparent"}
                                color="text_primary"
                                onClick={() => setOnlyUnreadFilter(true)}
                            >
                                {t("notifications_filter_unread")} ({unreadCount})
                            </Button>
                        </HStack>
                    </Box>

                    <Popover.Body p={2} maxH="380px" overflowY="auto">
                        {filteredNotifications.length === 0 ? (
                            <Box p={6} textAlign="center" color="text_secondary">
                                <Icon fontSize="32px" mb={2} color="text_secondary" opacity={0.6}>
                                    <MdNotifications />
                                </Icon>
                                <Text fontSize="sm">{t("notifications_empty")}</Text>
                            </Box>
                        ) : (
                            <VStack gap={2} align="stretch">
                                {filteredNotifications.map(item => (
                                    <Box
                                        key={item.id}
                                        p={3}
                                        borderRadius="md"
                                        backgroundColor={item.isRead ? "background_secondary" : "rgba(10, 142, 58, 0.08)"}
                                        borderLeftWidth="3px"
                                        borderLeftColor={getSeverityBorderColor(item.severity, item.isRead)}
                                        borderWidth="1px"
                                        borderColor={item.isRead ? "border_primary" : "rgba(10, 142, 58, 0.3)"}
                                        cursor="pointer"
                                        transition="background 0.2s"
                                        _hover={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <Flex justify="space-between" align="flex-start" gap={2}>
                                            <HStack align="flex-start" gap={2} flex={1}>
                                                <Box mt={0.5}>{getSeverityIcon(item.severity)}</Box>
                                                <Stack gap={1} flex={1}>
                                                    <Flex justify="space-between" align="center">
                                                        <Text fontWeight={item.isRead ? "medium" : "bold"} fontSize="sm" color="text_primary">
                                                            {item.title}
                                                        </Text>
                                                        <Text fontSize="11px" color="text_secondary">
                                                            {formatTimeAgo(item.createdAt)}
                                                        </Text>
                                                    </Flex>
                                                    <Text fontSize="xs" color="text_secondary" lineHeight="short">
                                                        {item.message}
                                                    </Text>
                                                </Stack>
                                            </HStack>
                                            {item.actionUrl && (
                                                <Icon fontSize="xs" color="text_secondary" mt={1}>
                                                    <MdOpenInNew />
                                                </Icon>
                                            )}
                                        </Flex>
                                    </Box>
                                ))}
                                {!onlyUnreadFilter && hasMore && (
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="action_primary"
                                        onClick={loadMore}
                                        loading={isLoadingMore}
                                        mt={1}
                                        width="100%"
                                    >
                                        {t("notifications_load_more")}
                                    </Button>
                                )}
                            </VStack>
                        )}
                    </Popover.Body>
                    <Box p={2} borderTopWidth="1px" borderColor="border_primary" textAlign="center">
                        <Button
                            size="xs"
                            variant="ghost"
                            color="action_primary"
                            width="100%"
                            onClick={() => {
                                setOpen(false);
                                navigate("/notifications");
                            }}
                        >
                            {t("notifications_open_full_page")}
                        </Button>
                    </Box>
                </Popover.Content>
            </Popover.Positioner>
        </Popover.Root>
    );
};
