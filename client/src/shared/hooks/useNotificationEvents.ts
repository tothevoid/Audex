import { useCallback } from "react";
import { NotificationEntity, NotificationEntityResponse } from "@/models/notifications/NotificationEntity";
import { prepareNotification } from "@/api/notifications/notificationApiMapping";
import { ServerNotificationEvents } from "@/shared/constants/serverNotificationEvents";
import { useSignalR } from "./useSignalR";

export interface NotificationEventsHandlers {
    onNotificationReceived?: (notification: NotificationEntity) => void;
    onNotificationRead?: (notificationId: string) => void;
    onAllNotificationsRead?: () => void;
}

export const useNotificationEvents = ({
    onNotificationReceived,
    onNotificationRead,
    onAllNotificationsRead,
}: NotificationEventsHandlers): void => {
    const handleNotificationReceived = useCallback((notificationPayload: NotificationEntityResponse) => {
        if (!notificationPayload) {
            return;
        }

        const notification = prepareNotification(notificationPayload);
        onNotificationReceived?.(notification);
    }, [onNotificationReceived]);

    const handleNotificationRead = useCallback((notificationId: string) => {
        if (!notificationId) {
            return;
        }

        onNotificationRead?.(notificationId);
    }, [onNotificationRead]);

    const handleAllNotificationsRead = useCallback(() => {
        onAllNotificationsRead?.();
    }, [onAllNotificationsRead]);

    useSignalR<NotificationEntityResponse>(ServerNotificationEvents.NotificationReceived, handleNotificationReceived);
    useSignalR<string>(ServerNotificationEvents.NotificationRead, handleNotificationRead);
    useSignalR<void>(ServerNotificationEvents.AllNotificationsRead, handleAllNotificationsRead);
};
