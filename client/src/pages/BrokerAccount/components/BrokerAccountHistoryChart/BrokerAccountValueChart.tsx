import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    YAxis,
    Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import { BrokerAccountPortfolioTimelinePointEntity } from "@/models/brokers/BrokerAccountPortfolioTimelinePointEntity";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { handleChartPointClick } from "@/shared/utilities/chartUtilities";
import { BrokerAccountValueTooltip } from "./BrokerAccountValueTooltip";

interface Props {
    data: BrokerAccountPortfolioTimelinePointEntity[];
    currencyName: string;
    onPointClick?: (date: Date) => void;
}

export const BrokerAccountValueChart: React.FC<Props> = ({
    data,
    currencyName,
    onPointClick,
}) => {
    const { t } = useTranslation();

    return (
        <Box width="100%">
            {/* Subheader: Portfolio Value */}
            <HStack gap={2} pl="121px" mb={1} alignItems="center">
                <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    backgroundColor="#3182CE"
                />
                <Text
                    fontSize="xs"
                    fontWeight={600}
                    color="text_secondary"
                >
                    {t("broker_account_portfolio_chart_value_series")}
                </Text>
            </HStack>

            {/* Area Chart: Portfolio Value */}
            <Box width="100%" height="180px">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        syncId="brokerPortfolioTimeline"
                        data={data}
                        margin={{ top: 8, right: 12, left: 16, bottom: 0 }}
                        onClick={(event) =>
                            handleChartPointClick(event, data, onPointClick)
                        }
                    >
                        <defs>
                            <linearGradient
                                id="portfolioValueGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#3182CE"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#3182CE"
                                    stopOpacity={0.0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--chakra-colors-border_primary)"
                            vertical={false}
                        />
                        <YAxis
                            domain={["auto", "auto"]}
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
                                <BrokerAccountValueTooltip
                                    currencyName={currencyName}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="portfolioValue"
                            stroke="#3182CE"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#portfolioValueGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};
