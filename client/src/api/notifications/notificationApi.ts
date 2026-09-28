import { NotificationEntity, NotificationEntityResponse } from "@/models/notifications/NotificationEntity";
import { deleteEntity, getEntity, getPagedEntities, postAction } from "@/api/basicApi";
import { BasePageable } from "@/shared/models/BasePageable";
import { PagedResult } from "@/shared/models/PagedResult";
import { prepareNotification } from "./notificationApiMapping";

const basicUrl = "Notification";

export interface NotificationsQuery extends BasePageable {
    onlyUnread?: boolean;
    category?: string;
}

export const getPagedNotifications = async (query: NotificationsQuery): Promise<PagedResult<NotificationEntity>> => {
    const pagedResult = await getPagedEntities<NotificationsQuery, NotificationEntityResponse>(`${basicUrl}/GetAll`, query);
    return {
        ...pagedResult,
        items: (pagedResult.items || []).map(prepareNotification)
    };
};

export const getUnreadNotificationCount = async (): Promise<number> => {
    const result = await getEntity<number>(`${basicUrl}/unread-count`);
    return typeof result === "number" ? result : 0;
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
    return await postAction(`${basicUrl}/${id}/read`, {});
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
    return await postAction(`${basicUrl}/read-all`, {});
};

export const deleteNotification = async (id: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, id);
};
