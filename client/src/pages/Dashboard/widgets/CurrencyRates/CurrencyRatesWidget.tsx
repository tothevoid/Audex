import React, { useEffect } from "react";
import { Box, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetComponentProps } from "../types";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { CurrencyRateCard } from "./CurrencyRateCard";
import { useCurrencies } from "@/shared/hooks/queries/useCurrencies";

export const CurrencyRatesWidget: React.FC<WidgetComponentProps<Record<string, unknown>>> = ({
    widget,
    refreshSignal,
    onFetched,
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const { data: currencies = [], isLoading, isError, dataUpdatedAt, refetch } = useCurrencies();

    useEffect(() => {
        if (refreshSignal && refreshSignal > 0) {
            const reloadCurrenciesAsync = async () => {
                await refetch();
            };

            reloadCurrenciesAsync();
        }
    }, [refreshSignal, refetch]);

    useEffect(() => {
        if (dataUpdatedAt) {
            onFetched?.(new Date(dataUpdatedAt));
        }
    }, [dataUpdatedAt, onFetched]);

    if (isLoading && currencies.length === 0) {
        return (
            <SimpleGrid columns={{ base: 2, sm: 4 }} gap={2.5} h="100%">
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
                <Skeleton height="100%" minHeight="120px" borderRadius="xl" />
            </SimpleGrid>
        );
    }

    if (isError && currencies.length === 0) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="loss">
                    {t("error_data_load")}
                </Text>
            </Box>
        );
    }

    const currentCurrencyId = user?.currency?.id;
    const currentCurrencyName = user?.currency?.name;

    const displayedCurrencies = currencies.filter((currency) => {
        const isCurrent =
            (currentCurrencyId && currency.id?.toLowerCase() === currentCurrencyId.toLowerCase()) ||
            (currentCurrencyName && currency.name?.toUpperCase() === currentCurrencyName.toUpperCase());

        return !isCurrent;
    });

    if (displayedCurrencies.length === 0) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="text_secondary">
                    {t("widget_currency_rates_empty")}
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

    const columnCount = Math.min(displayedCurrencies.length, maxColumns);

    return (
        <SimpleGrid
            columns={columnCount}
            gap={2.5}
            w="100%"
            h="100%"
            autoRows="1fr"
        >
            {displayedCurrencies.map((currency) => (
                <CurrencyRateCard
                    key={currency.id}
                    currency={currency}
                    userCurrencyName={currentCurrencyName}
                />
            ))}
        </SimpleGrid>
    );
};

export default CurrencyRatesWidget;
