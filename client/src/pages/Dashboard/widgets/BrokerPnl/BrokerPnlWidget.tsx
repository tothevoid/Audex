import React, { useEffect, useState } from "react";
import { Badge, Box, Flex, HStack, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiCalendar, FiGlobe } from "react-icons/fi";
import { WidgetComponentProps } from "../types";
import { BrokerPnlWidgetEntity, BrokerPnlWidgetSettings } from "./types";
import { getBrokerPnlWidget } from "@/api/dashboard/widgets/brokerPnl/brokerPnlWidgetApi";
import { IndicatorCard } from "@/shared/components/IndicatorCard";
import { getCurrencySymbol } from "@/shared/utilities/currencyUtils";

export const BrokerPnlWidget: React.FC<WidgetComponentProps<BrokerPnlWidgetSettings>> = ({
    widget,
    dashboardId,
    refreshSignal,
    onFetched
}) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [data, setData] = useState<BrokerPnlWidgetEntity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!dashboardId || !widget.id) {
                return;
            }

            const isSilent = Boolean(refreshSignal && refreshSignal > 0);
            if (!isSilent) {
                setIsLoading(true);
            }

            try {
                const result = await getBrokerPnlWidget({
                    dashboardId,
                    widgetId: widget.id,
                    brokerAccountId: widget.settings?.brokerAccountId
                });

                if (result && isMounted) {
                    setData(result);
                    setError(null);
                    onFetched?.(new Date(result.fetchedAt));
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
            <Box h="100%" display="flex" flexDirection="column" gap={2}>
                <Flex justify="flex-start">
                    <Skeleton height="16px" width="120px" borderRadius="md" />
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} flex="1">
                    <Skeleton height="100%" minHeight="70px" borderRadius="lg" />
                    <Skeleton height="100%" minHeight="70px" borderRadius="lg" />
                </SimpleGrid>
            </Box>
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

    if (!data) {
        return (
            <Box p={4} textAlign="center" m="auto">
                <Text fontSize="xs" color="text_secondary">
                    {t("widget_broker_pnl_empty")}
                </Text>
            </Box>
        );
    }

    const targetAccountText = data.selectedAccountName
        ? data.selectedAccountName
        : t("widget_broker_pnl_all_accounts");

    const columns = widget.grid.w <= 4 ? 1 : 2;
    const currencySymbol = getCurrencySymbol(data.currencyName, i18n.language);
    const targetRoute = widget.settings?.brokerAccountId
        ? `/broker_account/${widget.settings.brokerAccountId}`
        : "/broker_accounts";

    return (
        <Flex direction="column" h="100%" justify="space-between">
            {/* Top Subheader: Account selector badge */}
            <Flex justify="flex-start" align="center" mb={1.5}>
                <HStack
                    gap={1.5}
                    cursor="pointer"
                    onClick={() => navigate(targetRoute)}
                    _hover={{ opacity: 0.8 }}
                >
                    <Badge
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="2xs"
                        fontWeight="semibold"
                        backgroundColor="background_secondary"
                        color="text_primary"
                        borderWidth="1px"
                        borderColor="border_primary"
                    >
                        {targetAccountText}
                    </Badge>
                </HStack>
            </Flex>

            {/* Core Stats Grid */}
            <SimpleGrid columns={columns} gap={2} flex="1">
                <IndicatorCard
                    title={t("widget_broker_pnl_daily")}
                    amount={data.dailyAbsoluteChange}
                    percent={data.dailyPercentageChange}
                    currencySymbol={currencySymbol}
                    icon={<FiCalendar />}
                    onClick={() => navigate(targetRoute)}
                />

                <IndicatorCard
                    title={t("widget_broker_pnl_total")}
                    amount={data.totalAbsolutePnl}
                    percent={data.totalPercentagePnl}
                    currencySymbol={currencySymbol}
                    icon={<FiGlobe />}
                    onClick={() => navigate(targetRoute)}
                />
            </SimpleGrid>
        </Flex>
    );
};
