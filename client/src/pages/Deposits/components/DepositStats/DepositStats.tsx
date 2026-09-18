import { Box, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import React, { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDepositsSummary } from "../../../../api/deposits/depositApi";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import ButtonGroup, { ButtonGroupOption } from "../../../../shared/components/ButtonGroup/ButtonGroup";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { formatPeriodLabel } from "./depositChartUtils";
import { DepositMonthSummary } from "./depositMonthSummary";
import DepositsEarningsChart from "../DepositsEarningsChart/DepositsEarningsChart";
import StackedDepositsChart from "../StackedDepositsChart/StackedDepositsChart";
import LoadingCard from "../../../../shared/components/LoadingCard/LoadingCard";
import { BsGraphUp } from "react-icons/bs";

enum ChartType {
    Earnings = 0,
    Stacked = 1,
}

interface Props {
    selectedMinMonths: number;
    selectedMaxMonths: number;
    onlyActive: boolean;
}

interface State {
    summary: DepositMonthSummary | null;
    selectedChartType: ChartType;
    isLoading: boolean;
}

const DepositStats: React.FC<Props> = ({ selectedMinMonths, selectedMaxMonths, onlyActive }) => {
    const { t, i18n } = useTranslation();
    const { user } = useUserProfile();

    const [state, setState] = useState<State>({
        summary: null,
        selectedChartType: ChartType.Earnings,
        isLoading: true,
    });

    useEffect(() => {
        const getData = async () => {
            if (!selectedMinMonths || !selectedMaxMonths) {
                return;
            }

            setState((prev) => ({ ...prev, isLoading: true }));
            const summary = await getDepositsSummary(selectedMinMonths, selectedMaxMonths, onlyActive);
            setState((prev) => ({
                ...prev,
                summary: summary ?? null,
                isLoading: false,
            }));
        };
        getData();
    }, [selectedMinMonths, selectedMaxMonths, onlyActive]);

    const switchActiveChart = (newType: ChartType) => {
        setState((prev) => ({ ...prev, selectedChartType: newType }));
    };

    if (!user?.currency?.name) {
        return <Fragment />;
    }

    const chartTypeOptions: ButtonGroupOption<ChartType>[] = [
        { value: ChartType.Earnings, label: t("deposits_chart_type_earnings") },
        { value: ChartType.Stacked, label: t("deposits_chart_type_stacked") },
    ];

    if (state.isLoading && !state.summary) {
        return <LoadingCard />;
    }

    const currency = user.currency.name;
    const summary = state.summary;
    const hasData = summary && summary.payments.length > 0 && summary.totalEarnings > 0;

    return (
        <Box
            bg="background_primary"
            border="1px solid"
            borderColor="border_primary"
            borderRadius="xl"
            p={5}
            shadow="sm"
        >
            {/* Top Bar: Title, Metrics and Switcher */}
            <Flex
                justifyContent="space-between"
                alignItems={{ base: "flex-start", lg: "center" }}
                direction={{ base: "column", lg: "row" }}
                gap={4}
                mb={4}
            >
                <Flex alignItems="center" gap={2}>
                    <Box
                        p={2}
                        borderRadius="lg"
                        bg="status_success_bg"
                        color="gain"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <BsGraphUp size={18} />
                    </Box>
                    <Box>
                        <Text fontSize="md" fontWeight="bold" color="text_primary">
                            {t("deposits_stats_title")}
                        </Text>
                        <Text fontSize="xs" color="text_secondary">
                            {chartTypeOptions.find((o) => o.value === state.selectedChartType)?.label}
                        </Text>
                    </Box>
                </Flex>

                <ButtonGroup<ChartType>
                    options={chartTypeOptions}
                    value={state.selectedChartType}
                    onChange={switchActiveChart}
                />
            </Flex>

            {/* Quick Metrics Summary */}
            {hasData && (
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3} mb={4}>
                    <Box
                        bg="background_secondary"
                        border="1px solid"
                        borderColor="border_primary"
                        borderRadius="lg"
                        p={3}
                    >
                        <Text fontSize="2xs" color="text_secondary" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                            {t("deposits_stats_total_earnings")}
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="gain" mt={0.5}>
                            {formatMoneyByCurrencyCulture(summary.totalEarnings, currency)}
                        </Text>
                    </Box>

                    <Box
                        bg="background_secondary"
                        border="1px solid"
                        borderColor="border_primary"
                        borderRadius="lg"
                        p={3}
                    >
                        <Text fontSize="2xs" color="text_secondary" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                            {t("deposits_stats_avg_monthly")}
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="text_primary" mt={0.5}>
                            {formatMoneyByCurrencyCulture(summary.averageMonthly, currency)}
                        </Text>
                    </Box>

                    <Box
                        bg="background_secondary"
                        border="1px solid"
                        borderColor="border_primary"
                        borderRadius="lg"
                        p={3}
                    >
                        <Text fontSize="2xs" color="text_secondary" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                            {t("deposits_stats_max_month")}
                        </Text>
                        <Flex alignItems="baseline" gap={2} mt={0.5}>
                            <Text fontSize="lg" fontWeight="bold" color="text_primary">
                                {formatMoneyByCurrencyCulture(summary.peakMonthValue, currency)}
                            </Text>
                            {summary.peakMonthPeriod && (
                                <Text fontSize="xs" color="text_secondary">
                                    ({formatPeriodLabel(summary.peakMonthPeriod, i18n, "short")})
                                </Text>
                            )}
                        </Flex>
                    </Box>
                </SimpleGrid>
            )}

            {/* Chart Area */}
            {!hasData ? (
                <Flex
                    height="260px"
                    justifyContent="center"
                    alignItems="center"
                    direction="column"
                    gap={2}
                    bg="background_secondary"
                    borderRadius="lg"
                    border="1px dashed"
                    borderColor="border_primary"
                >
                    <Text fontSize="sm" color="text_secondary">
                        {t("deposits_stats_no_data")}
                    </Text>
                </Flex>
            ) : state.selectedChartType === ChartType.Stacked ? (
                <StackedDepositsChart currencyName={currency} data={state.summary!} />
            ) : (
                <DepositsEarningsChart currencyName={currency} data={state.summary!} />
            )}
        </Box>
    );
};

export default DepositStats;