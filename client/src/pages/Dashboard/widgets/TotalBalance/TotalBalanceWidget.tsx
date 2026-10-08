import React, { useEffect, useState, useCallback } from "react";
import { Box, Center, Flex, Spinner, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DistributionModel } from "@/models/dashboard/DashboardEntity";
import { Nullable } from "@/shared/utilities/nullable";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import DistributionChart from "@/pages/Dashboard/components/DistributionChart";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { WidgetComponentProps } from "@/pages/Dashboard/widgets/types";
import { getDistributionWidgetData, DistributionWidgetDataResponse } from "@/api/dashboard/widgets/distributionWidgetApi";

export const TotalBalanceWidget: React.FC<WidgetComponentProps> = ({
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
            const result = await getDistributionWidgetData("GetTotalBalanceWidgetData");
            setData(result ?? null);
            if (onFetched) {
                onFetched(new Date());
            }
        } finally {
            setIsLoading(false);
        }
    }, [onFetched]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshSignal, user?.currency?.id]);

    if (isLoading) {
        return (
            <Center h="100%" minH="220px">
                <Spinner size="lg" color="action_primary" />
            </Center>
        );
    }

    const rawDistribution = data?.distribution ?? [];
    const totalsData: DistributionModel[] = rawDistribution
        .filter(distributionItem => (distributionItem.convertedAmount ?? 0) > 0)
        .map(distributionItem => ({
            ...distributionItem,
            name: t(distributionItem.name, { defaultValue: distributionItem.name })
        }));

    if (totalsData.length === 0) {
        return (
            <Center h="100%" minH="220px">
                <Placeholder text={t("dashboard_empty")} />
            </Center>
        );
    }

    return (
        <Flex direction="column" gap={2} h="100%" flex="1" overflow="hidden">
            <Box px={1}>
                <Text
                    fontSize="2xs"
                    fontWeight={600}
                    color="text_secondary"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                >
                    {t("widget_total_label")}
                </Text>
                <Text fontWeight={700} fontSize="xl" color="text_primary" lineHeight="short">
                    {formatMoneyByCurrencyCulture(data?.total ?? 0, currency)}
                </Text>
            </Box>
            <Box flex="1" w="100%" minH="180px" overflow="hidden">
                <DistributionChart
                    data={totalsData}
                    mainCurrency={currency}
                />
            </Box>
        </Flex>
    );
};
