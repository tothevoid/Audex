import React, { useEffect, useState } from "react";
import { Box, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetComponentProps } from "../types";
import { IndicesWidgetEntity, IndicesWidgetSettings } from "@/models/dashboard/widgets/indices/IndicesWidgetEntity";
import { getIndicesWidget } from "@/api/dashboard/widgets/indices/indicesWidgetApi";
import { IndexQuoteCard } from "./IndexQuoteCard";

export const IndicesWidget: React.FC<WidgetComponentProps<IndicesWidgetSettings>> = ({
    widget,
    dashboardId,
    refreshSignal,
    onFetched
}) => {
    const { t } = useTranslation();
    const [data, setData] = useState<IndicesWidgetEntity | null>(null);
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
                const result = await getIndicesWidget({
                    dashboardId,
                    widgetId: widget.id,
                    codes: widget.settings?.codes ?? []
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
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={2.5} h="100%">
                <Skeleton height="100%" minHeight="110px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="110px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="110px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="110px" borderRadius="xl" />
            </SimpleGrid>
        );
    }

    if (error && !data) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="loss">
                    {error}
                </Text>
            </Box>
        );
    }

    const quotes = data?.indices ?? [];

    if (quotes.length === 0) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="text_secondary">
                    {t("widget_indices_empty")}
                </Text>
            </Box>
        );
    }

    const maxColumns =
        widget.grid.w <= 2 ? 1 :
        widget.grid.w <= 4 ? 2 :
        widget.grid.w <= 8 ? 4 :
        widget.grid.w <= 10 ? 6 :
        8;

    const columnCount = Math.min(quotes.length, maxColumns);

    return (
        <SimpleGrid
            columns={columnCount}
            gap={2.5}
            w="100%"
            h="100%"
        >
            {quotes.map((quote) => (
                <IndexQuoteCard key={quote.code} quote={quote} />
            ))}
        </SimpleGrid>
    );
};
