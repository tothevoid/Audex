import React, { useEffect, useState } from "react";
import { Box, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetComponentProps } from "../types";
import { OilWidgetEntity, OilWidgetSettings } from "@/models/dashboard/widgets/oil/OilWidgetEntity";
import { getOilWidget } from "@/api/dashboard/widgets/oil/oilWidgetApi";
import { OilQuoteCard } from "./OilQuoteCard";

export const OilWidget: React.FC<WidgetComponentProps<OilWidgetSettings>> = ({
    widget,
    dashboardId,
    refreshSignal,
    onFetched
}) => {
    const { t } = useTranslation();
    const [data, setData] = useState<OilWidgetEntity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!dashboardId || !widget.id) return;
            const isSilent = Boolean(refreshSignal && refreshSignal > 0);
            if (!isSilent) {
                setIsLoading(true);
            }
            try {
                const result = await getOilWidget({
                    dashboardId,
                    widgetId: widget.id,
                    symbols: widget.settings?.symbols ?? []
                });
                if (result && isMounted) {
                    setData(result);
                    setError(null);
                    onFetched?.(new Date());
                }
            } catch {
                if (isMounted) {
                    setError(t("error_data_load"));
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [dashboardId, widget.id, widget.settings, refreshSignal, onFetched, t]);

    if (isLoading && !data) {
        return (
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2.5} h="100%">
                <Skeleton height="100%" minHeight="110px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="110px" borderRadius="xl" />
            </SimpleGrid>
        );
    }

    if (error && !data) {
        return (
            <Box p={4} textAlign="center">
                <Text fontSize="xs" color="loss">
                    {error}
                </Text>
            </Box>
        );
    }

    const quotes = data?.quotes ?? [];

    if (quotes.length === 0) {
        return (
            <Box p={4} textAlign="center">
                <Text fontSize="xs" color="text_secondary">
                    {t("dashboard_no_available_widgets")}
                </Text>
            </Box>
        );
    }

    const columnCount = widget.grid.w <= 2 ? 1 : Math.min(quotes.length, 2);

    return (
        <SimpleGrid
            columns={columnCount}
            gap={2.5}
            w="100%"
            h="100%"
        >
            {quotes.map((quote) => (
                <OilQuoteCard key={quote.symbol} quote={quote} />
            ))}
        </SimpleGrid>
    );
};
