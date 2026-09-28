import { NotificationEntity, NotificationEntityResponse } from "@/models/notifications/NotificationEntity";

export const prepareNotification = (response: NotificationEntityResponse): NotificationEntity => ({
    id: response.id,
    userProfileId: response.userProfileId,
    title: response.title,
    message: response.message,
    severity: response.severity,
    actionUrl: response.actionUrl,
    category: response.category,
    isRead: response.isRead,
    createdAt: new Date(response.createdAt),
    readAt: response.readAt ? new Date(response.readAt) : undefined
});
