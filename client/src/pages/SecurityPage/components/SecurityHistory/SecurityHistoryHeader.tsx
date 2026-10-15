import React from "react";
import { Flex, HStack, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { ChartPeriod } from "@/shared/utilities/formatters/dateFormatter";
import { ChartPeriodSelector } from "@/shared/components/ChartPeriodSelector";
import { HistoryStats } from "./types";

const PERIODS: readonly ChartPeriod[] = [
    ChartPeriod.Day1,
    ChartPeriod.Week1,
    ChartPeriod.Month1,
    ChartPeriod.Month3,
    ChartPeriod.Month6,
    ChartPeriod.Year1,
    ChartPeriod.Year5,
    ChartPeriod.Year10,
];

interface Props {
    stats: HistoryStats;
    currencyName: string;
    selectedPeriod: ChartPeriod;
    onSelectPeriod: (period: ChartPeriod) => void;
    hasData: boolean;
}

const SecurityHistoryHeader: React.FC<Props> = ({
    stats,
    currencyName,
    selectedPeriod,
    onSelectPeriod,
    hasData,
}) => {
    const { t } = useTranslation();

    return (
        <Flex
            justifyContent="space-between"
            alignItems={{ base: "flex-start", lg: "center" }}
            flexDirection={{ base: "column", lg: "row" }}
            gap={4}
            mb={4}
        >
            {/* Left: Latest price & Period diff banner */}
            {hasData && (
                <HStack gap={4} flexWrap="wrap" alignItems="baseline">
                    <Text fontSize="2xl" fontWeight={900} color="text_primary">
                        {formatMoneyByCurrencyCulture(stats.endPrice, currencyName)}
                    </Text>
                    <HStack
                        gap={1.5}
                        px={2.5}
                        py={1}
                        borderRadius="md"
                        backgroundColor={stats.isPositive ? "pnl_positive_bg" : "pnl_negative_bg"}
                        borderColor={stats.isPositive ? "pnl_positive_border" : "pnl_negative_border"}
                        borderWidth="1px"
                        color={stats.isPositive ? "pnl_positive" : "pnl_negative"}
                        fontSize="xs"
                        fontWeight={700}
                    >
                        <Icon>
                            {stats.isPositive ? <BsArrowUpRight size={13} /> : <BsArrowDownRight size={13} />}
                        </Icon>
                        <Text>
                            {stats.isPositive ? "+" : ""}
                            {formatMoneyByCurrencyCulture(stats.diff, currencyName)} (
                            {stats.isPositive ? "+" : ""}
                            {stats.diffPercent.toFixed(2)}%)
                        </Text>
                    </HStack>
                </HStack>
            )}

            {/* Middle: Range metrics (Min, Avg, Max) */}
            {hasData && (
                <HStack gap={3} flexWrap="wrap" color="text_secondary" fontSize="xs">
                    <HStack gap={1} px={2.5} py={1} borderRadius="md" backgroundColor="background_secondary" borderWidth="1px" borderColor="border_primary">
                        <Text fontWeight={600}>{t("security_history_period_min")}:</Text>
                        <Text fontWeight={700} color="text_primary">
                            {formatMoneyByCurrencyCulture(stats.minPrice, currencyName)}
                        </Text>
                    </HStack>
                    <HStack gap={1} px={2.5} py={1} borderRadius="md" backgroundColor="background_secondary" borderWidth="1px" borderColor="border_primary">
                        <Text fontWeight={600}>{t("security_history_period_avg")}:</Text>
                        <Text fontWeight={700} color="text_primary">
                            {formatMoneyByCurrencyCulture(stats.avgPrice, currencyName)}
                        </Text>
                    </HStack>
                    <HStack gap={1} px={2.5} py={1} borderRadius="md" backgroundColor="background_secondary" borderWidth="1px" borderColor="border_primary">
                        <Text fontWeight={600}>{t("security_history_period_max")}:</Text>
                        <Text fontWeight={700} color="text_primary">
                            {formatMoneyByCurrencyCulture(stats.maxPrice, currencyName)}
                        </Text>
                    </HStack>
                </HStack>
            )}

            {/* Right: Period selector pills */}
            <ChartPeriodSelector
                periods={PERIODS}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={onSelectPeriod}
                size="sm"
            />
        </Flex>
    );
};

export default SecurityHistoryHeader;
