import React, { useEffect, useState, useCallback } from "react";
import { Box, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetComponentProps } from "../types";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { getCurrencies, syncRates } from "@/api/currencies/currencyApi";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { CurrencyRateCard } from "./CurrencyRateCard";

export const CurrencyRatesWidget: React.FC<WidgetComponentProps<Record<string, unknown>>> = ({
    widget,
    refreshSignal,
    onFetched
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const [currencies, setCurrencies] = useState<CurrencyEntity[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isSilent: boolean = false, syncWithCbr: boolean = false) => {
        if (!isSilent) {
            setIsLoading(true);
        }

        try {
            if (syncWithCbr) {
                try {
                    await syncRates();
                } catch {
                    // If CBR sync fails, continue to display current database rates
                }
            }

            const result = await getCurrencies();
            setCurrencies(result || []);
            setError(null);
            onFetched?.(new Date());
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
            fetchData(true, true);
        }
    }, [refreshSignal, fetchData]);

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

    if (error && currencies.length === 0) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="loss">
                    {error}
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
