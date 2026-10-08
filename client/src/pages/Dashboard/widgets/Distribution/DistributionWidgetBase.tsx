import React, { useEffect, useState, useCallback } from "react";
import { Box, Center, Flex, Spinner, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Nullable } from "@/shared/utilities/nullable";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import DistributionChart from "@/pages/Dashboard/components/DistributionChart";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { WidgetComponentProps } from "@/pages/Dashboard/widgets/types";
import { getDistributionWidgetData, DistributionWidgetDataResponse } from "@/api/dashboard/widgets/distributionWidgetApi";

export interface DistributionWidgetBaseProps extends WidgetComponentProps {
    endpoint: string;
    emptyText?: string;
    totalLabel?: string;
    outerRadius?: number | string;
    innerRadius?: number | string;
}

export const DistributionWidgetBase: React.FC<DistributionWidgetBaseProps> = ({
    endpoint,
    emptyText,
    totalLabel,
    outerRadius = "85%",
    innerRadius = "48%",
    refreshSignal,
    onFetched
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const [data, setData] = useState<Nullable<DistributionWidgetDataResponse>>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const currency = user?.currency.name ?? "";

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getDistributionWidgetData(endpoint);
            setData(result ?? null);
            if (onFetched) {
                onFetched(new Date());
            }
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, onFetched]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshSignal, user?.currency?.id]);

    if (isLoading) {
        return (
            <Center h="100%" minH="180px">
                <Spinner size="lg" color="action_primary" />
            </Center>
        );
    }

    const validDistribution = (data?.distribution ?? []).filter(item => (item.convertedAmount ?? 0) > 0);

    if (validDistribution.length === 0) {
        return (
            <Center h="100%" minH="180px">
                <Placeholder text={emptyText ?? t("dashboard_empty")} />
            </Center>
        );
    }

    const calculatedTotal = data?.total !== null && data?.total !== undefined
        ? data.total
        : validDistribution.reduce(
            (currentSum, distributionItem) => currentSum + (distributionItem.convertedAmount ?? 0),
            0
        );

    return (
        <Flex direction="column" gap={2} h="100%" flex="1" overflow="hidden">
            {calculatedTotal > 0 && (
                <Box px={1}>
                    <Text
                        fontSize="2xs"
                        fontWeight={600}
                        color="text_secondary"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                    >
                        {totalLabel ?? t("widget_total_label")}
                    </Text>
                    <Text fontWeight={700} fontSize="xl" color="text_primary" lineHeight="short">
                        {formatMoneyByCurrencyCulture(calculatedTotal, currency)}
                    </Text>
                </Box>
            )}
            <Box flex="1" w="100%" minH="180px" overflow="hidden">
                <DistributionChart
                    data={validDistribution}
                    mainCurrency={currency}
                    outerRadius={outerRadius}
                    innerRadius={innerRadius}
                />
            </Box>
        </Flex>
    );
};
