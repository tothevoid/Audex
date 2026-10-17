import React from "react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Line,
    ReferenceLine,
    ComposedChart,
    Area,
} from "recharts";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { SecurityTransactionsHistory } from "@/models/securities/SecurityTransactionsHistory";
import { SecurityTransactionsPriceTooltip } from "./SecurityTransactionsPriceTooltip";

interface Props {
    data: SecurityTransactionsHistory[];
    currencyName: string;
    currentPrice: number;
}

export const SecurityTransactionsPriceChart: React.FC<Props> = ({
    data,
    currencyName,
    currentPrice,
}) => {
    const { t } = useTranslation();

    return (
        <Box width="100%">
            {/* Subheader: Value Series Legend (aligned on the left with Y-axis) */}
            <HStack gap={4} pl="95px" mb={2} alignItems="center" flexWrap="wrap">
                <HStack gap={1.5} alignItems="center">
                    <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        backgroundColor="#10B981"
                    />
                    <Text fontSize="xs" fontWeight={600} color="text_secondary">
                        {t("securities_transactions_with_dividends")}
                    </Text>
                </HStack>

                <HStack gap={1.5} alignItems="center">
                    <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        backgroundColor="#3B82F6"
                    />
                    <Text fontSize="xs" fontWeight={600} color="text_secondary">
                        {t("securities_transactions_without_dividends")}
                    </Text>
                </HStack>

                <HStack gap={1.5} alignItems="center">
                    <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        backgroundColor="#EAB308"
                    />
                    <Text fontSize="xs" fontWeight={600} color="text_secondary">
                        {t("securities_transactions_current_price")}:{" "}
                        <Text as="span" color="#EAB308" fontWeight={700}>
                            {formatMoneyByCurrencyCulture(currentPrice, currencyName, 2)}
                        </Text>
                    </Text>
                </HStack>
            </HStack>

            {/* Primary Chart: Value with & without Dividends */}
            <Box width="100%" height="260px">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        syncId="securityTransactionsSync"
                        data={data}
                        margin={{
                            top: 10,
                            right: 20,
                            bottom: 0,
                            left: 10,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="valueWithPaymentsGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--chakra-colors-border_primary)"
                            vertical={false}
                        />
                        <XAxis dataKey="date" hide scale="band" />
                        <YAxis
                            width={85}
                            domain={["auto", "auto"]}
                            stroke="var(--chakra-colors-text_secondary)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{ stroke: "var(--chakra-colors-border_primary)" }}
                            tickFormatter={(value: number) =>
                                formatMoneyByCurrencyCulture(value, currencyName, 2)
                            }
                        />

                        {/* Solid Area with Emerald Gradient for Value with Dividends */}
                        <Area
                            type="monotone"
                            dataKey="valueWithPayments"
                            stroke="#10B981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#valueWithPaymentsGradient)"
                            activeDot={{
                                r: 6,
                                stroke: "var(--chakra-colors-background_primary)",
                                strokeWidth: 2,
                            }}
                            dot={{
                                r: 3,
                                fill: "#10B981",
                                strokeWidth: 1,
                                stroke: "var(--chakra-colors-background_primary)",
                            }}
                            name={t("securities_transactions_with_dividends")}
                        />

                        {/* Distinct Blue Dashed Line for Value without Dividends */}
                        <Line
                            type="monotone"
                            dataKey="valueWithoutPayments"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            activeDot={{ r: 5 }}
                            dot={{ r: 3, fill: "#3B82F6", strokeWidth: 1 }}
                            name={t("securities_transactions_without_dividends")}
                        />

                        <ReferenceLine
                            y={currentPrice}
                            stroke="#EAB308"
                            strokeDasharray="4 4"
                        />
                        <Tooltip
                            content={
                                <SecurityTransactionsPriceTooltip
                                    currencyName={currencyName}
                                />
                            }
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default SecurityTransactionsPriceChart;
