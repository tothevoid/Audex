import { useCallback } from "react";
import { NotificationEntity, NotificationEntityResponse } from "@/models/notifications/NotificationEntity";
import { prepareNotification } from "@/api/notifications/notificationApiMapping";
import { useSignalR } from "./useSignalR";

export interface NotificationEventsHandlers {
    onNotificationReceived?: (notification: NotificationEntity) => void;
    onNotificationRead?: (notificationId: string) => void;
    onAllNotificationsRead?: () => void;
}

export const useNotificationEvents = (handlers: NotificationEventsHandlers) => {
    const handleSignalRMessage = useCallback((rawMessage: string) => {
        try {
            const data = typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;
            if (data?.type === "NotificationReceived" && data.payload) {
                const notification = prepareNotification(data.payload as NotificationEntityResponse);
                handlers.onNotificationReceived?.(notification);
            } else if (data?.type === "NotificationRead" && data.notificationId) {
                handlers.onNotificationRead?.(data.notificationId);
            } else if (data?.type === "AllNotificationsRead") {
                handlers.onAllNotificationsRead?.();
            }
        } catch {
            // Ignore non-JSON or irrelevant messages
        }
    }, [handlers.onNotificationReceived, handlers.onNotificationRead, handlers.onAllNotificationsRead]);

    useSignalR(handleSignalRMessage);
};
