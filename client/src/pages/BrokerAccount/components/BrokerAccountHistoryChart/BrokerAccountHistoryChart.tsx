import React, { useMemo } from "react";
import {
    Box,
    Card,
    Flex,
    HStack,
    Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BrokerAccountPortfolioTimelinePointEntity } from "@/models/brokers/BrokerAccountPortfolioTimelinePointEntity";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { AccentBadge } from "@/shared/components/AccentBadge";
import { ChartPeriod } from "@/models/common/ChartPeriod";
import { PlaceholderWrapper } from "@/shared/components/Placeholder";
import { LoadingChart } from "@/shared/components/LoadingChart";
import { ChartPeriodSelector } from "@/shared/components/ChartPeriodSelector";
import { PORTFOLIO_CHART_PERIODS } from "./types";
import { BrokerAccountValueChart } from "./BrokerAccountValueChart";
import { BrokerAccountPnLSubChart } from "./BrokerAccountPnLSubChart";

interface Props {
    data: BrokerAccountPortfolioTimelinePointEntity[];
    currencyName: string;
    selectedPeriod: ChartPeriod;
    onSelectPeriod: (period: ChartPeriod) => void;
    isLoading?: boolean;
    onPointClick?: (date: Date) => void;
}

export const BrokerAccountHistoryChart: React.FC<Props> = ({
    data,
    currencyName,
    selectedPeriod,
    onSelectPeriod,
    isLoading = false,
    onPointClick,
}) => {
    const { t } = useTranslation();

    const hasData = data && data.length > 0;

    const latestPoint = useMemo(() => {
        if (!data || data.length === 0) {
            return null;
        }
        return data[data.length - 1];
    }, [data]);

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderWidth="1px"
            p={4}
            borderRadius="xl"
            boxShadow="sm"
            mb={4}
        >
            <Flex
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={3}
                mb={4}
            >
                <HStack gap={3} flexWrap="wrap">
                    <Text fontSize="md" fontWeight={700} color="text_primary">
                        {t("broker_account_portfolio_chart_title")}
                    </Text>

                    {latestPoint && (
                        <HStack gap={2}>
                            <AccentBadge
                                variant="info"
                                size="sm"
                                px={2}
                                py={0.5}
                                showDot
                            >
                                {formatMoneyByCurrencyCulture(
                                    latestPoint.portfolioValue,
                                    currencyName,
                                    0
                                )}
                            </AccentBadge>

                            <AccentBadge
                                variant={
                                    latestPoint.profitAndLoss >= 0
                                        ? "success"
                                        : "danger"
                                }
                                size="sm"
                                px={2}
                                py={0.5}
                                showDot
                            >
                                {latestPoint.profitAndLoss >= 0 ? "+" : ""}
                                {formatMoneyByCurrencyCulture(
                                    latestPoint.profitAndLoss,
                                    currencyName,
                                    0
                                )}
                            </AccentBadge>
                        </HStack>
                    )}
                </HStack>

                <ChartPeriodSelector
                    periods={PORTFOLIO_CHART_PERIODS}
                    selectedPeriod={selectedPeriod}
                    onSelectPeriod={onSelectPeriod}
                    isDisabled={isLoading}
                    size="xs"
                    variant="full"
                />
            </Flex>

            <LoadingChart isLoading={isLoading} height="380px" borderRadius="lg">
                <PlaceholderWrapper
                    hasData={hasData}
                    text={t("broker_account_portfolio_chart_no_data")}
                    placeholderBoxProps={{ mb: 0 }}
                >
                    <Box width="100%">
                        <BrokerAccountValueChart
                            data={data}
                            currencyName={currencyName}
                            onPointClick={onPointClick}
                        />

                        <BrokerAccountPnLSubChart
                            data={data}
                            currencyName={currencyName}
                            selectedPeriod={selectedPeriod}
                            isPnlPositive={latestPoint ? latestPoint.profitAndLoss >= 0 : true}
                            onPointClick={onPointClick}
                        />
                    </Box>
                </PlaceholderWrapper>
            </LoadingChart>
        </Card.Root>
    );
};
