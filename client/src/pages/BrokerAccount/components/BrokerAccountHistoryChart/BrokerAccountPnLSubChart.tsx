import React, { useMemo } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
} from "recharts";
import { useTranslation } from "react-i18next";
import { BrokerAccountPortfolioTimelinePointEntity } from "@/models/brokers/BrokerAccountPortfolioTimelinePointEntity";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { formatChartAxisDate } from "@/shared/utilities/formatters/dateFormatter";
import { handleChartPointClick } from "@/shared/utilities/chartUtilities";
import { BrokerAccountPnLTooltip } from "./BrokerAccountPnLTooltip";
import { ChartPeriod } from "@/models/common/ChartPeriod";

interface Props {
    data: BrokerAccountPortfolioTimelinePointEntity[];
    currencyName: string;
    selectedPeriod: ChartPeriod;
    isPnlPositive: boolean;
    onPointClick?: (date: Date) => void;
}

export const BrokerAccountPnLSubChart: React.FC<Props> = ({
    data,
    currencyName,
    selectedPeriod,
    isPnlPositive,
    onPointClick,
}) => {
    const { t, i18n } = useTranslation();

    const pnlDomain = useMemo<[number, number]>(() => {
        if (!data || data.length === 0) {
            return [0, 0];
        }
        const values = data.map((point) => point.profitAndLoss);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        const range = Math.max(maxValue - minValue, 1);
        const padding = range * 0.12;

        const domainMin = Math.floor(
            minValue < 0 ? minValue - padding : Math.min(0, minValue - padding)
        );
        const domainMax = Math.ceil(
            maxValue > 0 ? maxValue + padding : Math.max(0, maxValue + padding)
        );

        return [domainMin, domainMax];
    }, [data]);

    const pnlGradientOffset = useMemo(() => {
        const [domainMin, domainMax] = pnlDomain;
        if (domainMax <= 0) {
            return 0;
        }
        if (domainMin >= 0) {
            return 1;
        }

        return domainMax / (domainMax - domainMin);
    }, [pnlDomain]);

    return (
        <Box width="100%">
            {/* Subheader: Profit & Loss */}
            <HStack gap={2} pl="121px" mt={3} mb={1} alignItems="center">
                <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    backgroundColor={
                        isPnlPositive
                            ? "var(--chakra-colors-gain)"
                            : "var(--chakra-colors-loss)"
                    }
                />
                <Text
                    fontSize="xs"
                    fontWeight={600}
                    color="text_secondary"
                >
                    {t("broker_account_portfolio_chart_pnl_series")}
                </Text>
            </HStack>

            {/* Area Chart: Profit & Loss */}
            <Box width="100%" height="165px">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        syncId="brokerPortfolioTimeline"
                        data={data}
                        margin={{ top: 5, right: 12, left: 16, bottom: 14 }}
                        onClick={(event) =>
                            handleChartPointClick(event, data, onPointClick)
                        }
                    >
                        <defs>
                            <linearGradient
                                id="profitAndLossSplit"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset={0}
                                    stopColor="var(--chakra-colors-gain)"
                                    stopOpacity={0.35}
                                />
                                <stop
                                    offset={pnlGradientOffset}
                                    stopColor="var(--chakra-colors-gain)"
                                    stopOpacity={0.05}
                                />
                                <stop
                                    offset={pnlGradientOffset}
                                    stopColor="var(--chakra-colors-loss)"
                                    stopOpacity={0.05}
                                />
                                <stop
                                    offset={1}
                                    stopColor="var(--chakra-colors-loss)"
                                    stopOpacity={0.35}
                                />
                            </linearGradient>
                            <linearGradient
                                id="profitAndLossStroke"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset={0}
                                    stopColor="var(--chakra-colors-gain)"
                                />
                                <stop
                                    offset={pnlGradientOffset}
                                    stopColor="var(--chakra-colors-gain)"
                                />
                                <stop
                                    offset={pnlGradientOffset}
                                    stopColor="var(--chakra-colors-loss)"
                                />
                                <stop
                                    offset={1}
                                    stopColor="var(--chakra-colors-loss)"
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--chakra-colors-border_primary)"
                            vertical={false}
                        />
                        <ReferenceLine
                            y={0}
                            stroke="var(--chakra-colors-border_primary)"
                            strokeDasharray="3 3"
                        />
                        <XAxis
                            dataKey="date"
                            stroke="var(--chakra-colors-text_secondary)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{
                                stroke: "var(--chakra-colors-border_primary)",
                            }}
                            minTickGap={45}
                            interval="equidistantPreserveStart"
                            dy={6}
                            tickFormatter={(dateString: string) => {
                                const parsedDate = new Date(dateString);
                                return formatChartAxisDate(
                                    parsedDate,
                                    selectedPeriod,
                                    i18n
                                );
                            }}
                        />
                        <YAxis
                            domain={pnlDomain}
                            stroke="var(--chakra-colors-text_secondary)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{
                                stroke: "var(--chakra-colors-border_primary)",
                            }}
                            tickFormatter={(numericValue: number) =>
                                formatMoneyByCurrencyCulture(
                                    numericValue,
                                    currencyName,
                                    0
                                )
                            }
                            width={105}
                            dx={-4}
                        />
                        <Tooltip
                            content={
                                <BrokerAccountPnLTooltip
                                    currencyName={currencyName}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="profitAndLoss"
                            stroke="url(#profitAndLossStroke)"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#profitAndLossSplit)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};
