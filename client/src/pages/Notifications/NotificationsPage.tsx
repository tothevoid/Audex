import React from "react";
import { Container, VStack } from "@chakra-ui/react";
import { NotificationsHeader } from "./components/NotificationsHeader";
import { NotificationsFilterBar } from "./components/NotificationsFilterBar";
import { NotificationsList } from "./components/NotificationsList";
import CollectionPagination from "@/shared/components/CollectionPagination/CollectionPagination";
import { useNotifications } from "@/shared/hooks/useNotifications";

const NotificationsPage: React.FC = () => {
    const {
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
        deleteNotification
    } = useNotifications({ autoLoad: true, initialPageSize: 15 });

    return (
        <Container maxW="1000px" pb={6}>
            <VStack align="stretch" gap={6}>
                <NotificationsHeader
                    unreadCount={unreadCount}
                    onMarkAllAsRead={markAllAsRead}
                />

                <NotificationsFilterBar
                    onlyUnreadFilter={onlyUnreadFilter}
                    unreadCount={unreadCount}
                    selectedCategory={selectedCategory}
                    categories={categories}
                    onToggleUnreadFilter={setOnlyUnreadFilter}
                    onSelectCategory={setSelectedCategory}
                />

                <NotificationsList
                    items={notifications}
                    isLoading={isLoading}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                />

                <CollectionPagination
                    count={totalCount}
                    page={pageIndex}
                    pageSize={recordsQuantity}
                    onPageChange={loadPage}
                />
            </VStack>
        </Container>
    );
};

export default NotificationsPage;

