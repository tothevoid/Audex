import React, { useEffect, useState, useCallback } from "react";
import { Box, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetComponentProps } from "../types";
import { BrokerAccountDailyStatsEntity } from "@/models/brokers/BrokerAccountDailyStatsEntity";
import { getDailyStats } from "@/api/brokers/brokerAccountSummaryApi";
import { SecurityDailyCard } from "./SecurityDailyCard";

export const SecuritiesDailyWidget: React.FC<WidgetComponentProps<Record<string, unknown>>> = ({
    widget,
    refreshSignal,
    onFetched
}) => {
    const { t } = useTranslation();
    const [data, setData] = useState<BrokerAccountDailyStatsEntity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isSilent: boolean = false) => {
        if (!isSilent) {
            setIsLoading(true);
        }

        try {
            const result = await getDailyStats(null);
            if (result) {
                setData(result);
                setError(null);
                onFetched?.(new Date(result.fetchDate));
            }
        } catch {
            setError(t("error_data_load"));
        } finally {
            setIsLoading(false);
        }
    }, [onFetched, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (refreshSignal && refreshSignal > 0) {
            fetchData(true);
        }
    }, [refreshSignal, fetchData]);

    if (isLoading && !data) {
        return (
            <SimpleGrid columns={{ base: 2, sm: 4 }} gap={2.5} h="100%">
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
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

    const stats = data?.brokerAccountDailySecurityStats ?? [];

    if (stats.length === 0) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="text_secondary">
                    {t("widget_securities_daily_empty")}
                </Text>
            </Box>
        );
    }

    const columnCount =
        widget.grid.w <= 2 ? 1 :
        widget.grid.w <= 4 ? 2 :
        widget.grid.w <= 8 ? 4 :
        widget.grid.w <= 10 ? 6 :
        8;

    return (
        <SimpleGrid
            columns={columnCount}
            gap={2.5}
            w="100%"
            h="100%"
            autoRows="1fr"
        >
            {stats.map((stat) => (
                <SecurityDailyCard
                    key={stat.security.id}
                    stat={stat}
                />
            ))}
        </SimpleGrid>
    );
};
