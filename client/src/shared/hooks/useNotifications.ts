import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationEntity } from "../../models/notifications/NotificationEntity";
import {
    deleteNotification as apiDeleteNotification,
    getPagedNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead as apiMarkAllAsRead,
    markNotificationAsRead as apiMarkAsRead,
    NotificationsQuery
} from "../../api/notifications/notificationApi";
import { useNotificationEvents } from "./useNotificationEvents";
import { usePagedQuery } from "./usePagedQuery";

export interface UseNotificationsOptions {
    autoLoad?: boolean;
    initialOnlyUnread?: boolean;
    initialCategory?: string;
    initialPageSize?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
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
        isLoadingNextPage,
        hasNextPage,
        loadPage,
        loadNextPage,
        refreshPage,
        reset
    } = usePagedQuery<NotificationEntity, NotificationsQuery>({
        fetchData: getPagedNotifications,
        filters,
        initialPageSize,
        autoLoad,
        keySelector: (notification) => notification.id
    });

    const loadUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to load unread notification count", error);
        }
    }, []);

    useEffect(() => {
        loadUnreadCount();
    }, [loadUnreadCount]);

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
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        } finally {
            loadUnreadCount();
            refreshPage();
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiMarkAllAsRead();
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
        } finally {
            setUnreadCount(0);
            if (onlyUnreadFilter) {
                reset();
            } else {
                refreshPage();
            }
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await apiDeleteNotification(id);
        } catch (error) {
            console.error("Failed to delete notification", error);
        } finally {
            loadUnreadCount();
            refreshPage();
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
        hasNextPage,
        isLoadingNextPage,
        onlyUnreadFilter,
        selectedCategory,
        categories,
        setOnlyUnreadFilter,
        setSelectedCategory,
        loadPage,
        loadNextPage,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshPage,
        reset,
        loadUnreadCount
    };
};


