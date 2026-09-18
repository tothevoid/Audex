import React from "react";
import { Button, Card, Flex, HStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface NotificationsFilterBarProps {
    onlyUnreadFilter: boolean;
    unreadCount: number;
    selectedCategory: string;
    categories: string[];
    onToggleUnreadFilter: (onlyUnread: boolean) => void;
    onSelectCategory: (category: string) => void;
}

export const NotificationsFilterBar: React.FC<NotificationsFilterBarProps> = ({
    onlyUnreadFilter,
    unreadCount,
    selectedCategory,
    categories,
    onToggleUnreadFilter,
    onSelectCategory
}) => {
    const { t } = useTranslation();

    return (
        <Card.Root backgroundColor="background_secondary" borderColor="border_primary" borderWidth="1px" p={4} borderRadius="xl">
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                <HStack gap={2}>
                    <Button
                        size="sm"
                        variant={!onlyUnreadFilter ? "solid" : "ghost"}
                        onClick={() => onToggleUnreadFilter(false)}
                    >
                        {t("notifications_filter_all")}
                    </Button>
                    <Button
                        size="sm"
                        variant={onlyUnreadFilter ? "solid" : "ghost"}
                        onClick={() => onToggleUnreadFilter(true)}
                    >
                        {t("notifications_filter_unread")} ({unreadCount})
                    </Button>
                </HStack>

                {categories.length > 1 && (
                    <HStack gap={1} wrap="wrap">
                        <Button
                            size="xs"
                            variant={selectedCategory === "All" ? "solid" : "outline"}
                            borderColor="border_primary"
                            onClick={() => onSelectCategory("All")}
                        >
                            {t("notifications_category_all")}
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                size="xs"
                                variant={selectedCategory === cat ? "solid" : "outline"}
                                borderColor="border_primary"
                                onClick={() => onSelectCategory(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </HStack>
                )}
            </Flex>
        </Card.Root>
    );
};
