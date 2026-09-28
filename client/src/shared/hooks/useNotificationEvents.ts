import { useCallback } from "react";
import { NotificationEntity, NotificationEntityResponse } from "@/models/notifications/NotificationEntity";
import { prepareNotification } from "@/api/notifications/notificationApiMapping";
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
}: NotificationEventsHandlers) => {
    const handleSignalRMessage = useCallback((rawMessage: string) => {
        try {
            const data = typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;
            if (data?.type === "NotificationReceived" && data.payload) {
                const notification = prepareNotification(data.payload as NotificationEntityResponse);
                onNotificationReceived?.(notification);
            } else if (data?.type === "NotificationRead" && data.notificationId) {
                onNotificationRead?.(data.notificationId);
            } else if (data?.type === "AllNotificationsRead") {
                onAllNotificationsRead?.();
            }
        } catch {
            // Ignore non-JSON or irrelevant messages
        }
    }, [onNotificationReceived, onNotificationRead, onAllNotificationsRead]);

    useSignalR(handleSignalRMessage);
};
