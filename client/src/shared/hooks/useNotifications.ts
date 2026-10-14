import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NotificationEntity } from "@/models/notifications/NotificationEntity";
import {
    deleteNotification as apiDeleteNotification,
    getPagedNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead as apiMarkAllAsRead,
    markNotificationAsRead as apiMarkAsRead,
    NotificationsQuery
} from "@/api/notifications/notificationApi";
import { notify } from "@/shared/components/Toaster/notify";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { useNotificationEvents } from "./useNotificationEvents";
import { usePagedQuery } from "./usePagedQuery";

export interface UseNotificationsOptions {
    autoLoad?: boolean;
    initialOnlyUnread?: boolean;
    initialCategory?: string;
    initialPageSize?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
    const { t } = useTranslation();
    const {
        autoLoad = true,
        initialOnlyUnread = false,
        initialCategory = "All",
        initialPageSize = 15
    } = options;

    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [onlyUnreadFilter, setOnlyUnreadFilter] = useState<boolean>(initialOnlyUnread);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

    const filters = useMemo(() => ({
        onlyUnread: onlyUnreadFilter,
        category: selectedCategory
    }), [onlyUnreadFilter, selectedCategory]);

    const {
        items: notifications,
        totalCount,
        pageIndex,
        pageSize: recordsQuantity,
        isLoading,
        loadPage,
        refreshPage,
        reset
    } = usePagedQuery<NotificationEntity, NotificationsQuery>({
        fetchData: getPagedNotifications,
        filters,
        initialPageSize,
        autoLoad
    });

    const loadUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (error: unknown) {
            console.error("Failed to load unread notification count", error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncUnreadCount = async () => {
            try {
                const count = await getUnreadNotificationCount();
                if (isMounted) {
                    setUnreadCount(count);
                }
            } catch (error: unknown) {
                console.error("Failed to load unread notification count", error);
            }
        };

        syncUnreadCount();

        return () => {
            isMounted = false;
        };
    }, []);

    useNotificationEvents({
        onNotificationReceived: useCallback((_notification: NotificationEntity) => {
            loadUnreadCount();
            if (pageIndex === 1) {
                refreshPage();
            }
        }, [pageIndex, refreshPage, loadUnreadCount]),
        onNotificationRead: useCallback((_notificationId: string) => {
            loadUnreadCount();
            refreshPage();
        }, [refreshPage, loadUnreadCount]),
        onAllNotificationsRead: useCallback(() => {
            setUnreadCount(0);
            refreshPage();
        }, [refreshPage])
    });

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await apiMarkAsRead(id);
            await loadUnreadCount();
            refreshPage();
        } catch (error: unknown) {
            notify.error(t("notifications_mark_read_error"), parseErrorMessage(error));
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiMarkAllAsRead();
            setUnreadCount(0);
            if (onlyUnreadFilter) {
                reset();
            } else {
                refreshPage();
            }
        } catch (error: unknown) {
            notify.error(t("notifications_mark_all_read_error"), parseErrorMessage(error));
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await apiDeleteNotification(id);
            await loadUnreadCount();
            refreshPage();
        } catch (error: unknown) {
            notify.error(t("notifications_delete_error"), parseErrorMessage(error));
        }
    };

    const categories = Array.from(new Set(notifications.map(notification => notification.category || "System")));

    return {
        notifications,
        unreadCount,
        totalCount,
        pageIndex,
        recordsQuantity,
        isLoading,
        onlyUnreadFilter,
        selectedCategory,
        categories,
        setOnlyUnreadFilter,
        setSelectedCategory,
        loadPage,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshPage,
        reset,
        loadUnreadCount
    };
};


