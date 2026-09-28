import React, { useMemo, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getChartColor, CHART_THEME_COLORS } from "@/shared/constants/chartColors";
import { DepositMonthSummary } from "@/pages/Deposits/components/DepositStats/depositMonthSummary";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { formatPeriodLabel } from "@/pages/Deposits/components/DepositStats/depositChartUtils";
import { useTranslation } from "react-i18next";
import StackedDepositsTooltip from "./StackedDepositsTooltip";

interface Props {
    data: DepositMonthSummary;
    currencyName: string;
}

interface DepositLegendItem {
    id: string;
    name: string;
    total: number;
    color: string;
}

const StackedDepositsChart: React.FC<Props> = ({ data, currencyName }) => {
    const { i18n } = useTranslation();
    const [hoveredDepositId, setHoveredDepositId] = useState<string | null>(null);
    const [hiddenDepositIds, setHiddenDepositIds] = useState<Set<string>>(new Set());

    const { chartData, depositsMap, depositList } = useMemo(() => {
        const dMap = new Map<string, string>();

        if (!data?.payments) {
            return {
                chartData: [],
                depositsMap: dMap,
                depositList: [] as DepositLegendItem[],
            };
        }

        const rows = data.payments.map((payment) => {
            const row: Record<string, number | string> = {
                date: payment.period,
            };

            payment.payments.forEach((p) => {
                row[p.depositId] = p.value || 0;

                if (!dMap.has(p.depositId)) {
                    dMap.set(p.depositId, p.name);
                }
            });

            return row;
        });

        const totals = data.depositTotals || [];
        const list: DepositLegendItem[] = totals.map((dep, index) => {
            if (!dMap.has(dep.depositId)) {
                dMap.set(dep.depositId, dep.name);
            }
            return {
                id: dep.depositId,
                name: dep.name,
                total: dep.totalValue,
                color: getChartColor(index),
            };
        });

        return {
            chartData: rows,
            depositsMap: dMap,
            depositList: list,
        };
    }, [data]);

    const toggleDepositVisibility = (depositId: string) => {
        setHiddenDepositIds((prev: Set<string>) => {
            const next = new Set(prev);
            if (next.has(depositId)) {
                next.delete(depositId);
            } else {
                // Keep at least one visible deposit
                if (next.size < depositList.length - 1) {
                    next.add(depositId);
                }
            }
            return next;
        });
    };

    const visibleDeposits = depositList.filter((d: DepositLegendItem) => !hiddenDepositIds.has(d.id));

    return (
        <Box width="100%" mt={2}>
            <Box height="360px" width="100%">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 15, right: 20, left: 10, bottom: 10 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={CHART_THEME_COLORS.grid}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={{ stroke: CHART_THEME_COLORS.axisLine }}
                            tick={{ fill: CHART_THEME_COLORS.axisText, fontSize: 11 }}
                            tickFormatter={(period: string) => formatPeriodLabel(period, i18n, "short")}
                            dy={6}
                        />
                        <YAxis
                            width={85}
                            tickLine={false}
                            axisLine={{ stroke: CHART_THEME_COLORS.axisLine }}
                            tick={{ fill: CHART_THEME_COLORS.axisText, fontSize: 11 }}
                            tickFormatter={(val: number) => formatMoneyByCurrencyCulture(val, currencyName, 0)}
                            dx={-4}
                        />
                        <Tooltip
                            content={
                                <StackedDepositsTooltip
                                    currencyName={currencyName}
                                    depositsMap={depositsMap}
                                />
                            }
                            cursor={{ fill: CHART_THEME_COLORS.cursorFill }}
                        />
                        {visibleDeposits.map((dep: DepositLegendItem, index: number) => {
                            const isHovered = hoveredDepositId === dep.id;
                            const hasAnyHover = hoveredDepositId !== null;
                            const isTopBar = index === visibleDeposits.length - 1;

                            return (
                                <Bar
                                    key={dep.id}
                                    dataKey={dep.id}
                                    stackId="depositsStack"
                                    fill={dep.color}
                                    fillOpacity={hasAnyHover ? (isHovered ? 1 : 0.25) : 0.88}
                                    maxBarSize={44}
                                    radius={isTopBar ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    onMouseEnter={() => setHoveredDepositId(dep.id)}
                                    onMouseLeave={() => setHoveredDepositId(null)}
                                />
                            );
                        })}
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Interactive custom legend pills */}
            {depositList.length > 0 && (
                <Flex
                    mt={4}
                    pt={3}
                    borderTop="1px solid"
                    borderColor={CHART_THEME_COLORS.divider}
                    wrap="wrap"
                    gap={2}
                    justifyContent="center"
                >
                    {depositList.map((dep: DepositLegendItem) => {
                        const isHidden = hiddenDepositIds.has(dep.id);
                        const isHovered = hoveredDepositId === dep.id;

                        return (
                            <Flex
                                key={dep.id}
                                as="button"
                                alignItems="center"
                                gap={2}
                                px={3}
                                py={1.5}
                                borderRadius="full"
                                bg={
                                    isHovered
                                        ? "rgba(255, 255, 255, 0.1)"
                                        : isHidden
                                        ? "rgba(255, 255, 255, 0.02)"
                                        : "rgba(255, 255, 255, 0.05)"
                                }
                                border="1px solid"
                                borderColor={
                                    isHovered
                                        ? dep.color
                                        : isHidden
                                        ? "transparent"
                                        : "rgba(255, 255, 255, 0.08)"
                                }
                                opacity={isHidden ? 0.4 : 1}
                                transition="all 0.15s ease-in-out"
                                cursor="pointer"
                                onClick={() => toggleDepositVisibility(dep.id)}
                                onMouseEnter={() => setHoveredDepositId(dep.id)}
                                onMouseLeave={() => setHoveredDepositId(null)}
                            >
                                <Box
                                    w={2.5}
                                    h={2.5}
                                    borderRadius="full"
                                    bg={dep.color}
                                    boxShadow={!isHidden ? `0 0 6px ${dep.color}80` : "none"}
                                    flexShrink={0}
                                />
                                <Text
                                    fontSize="xs"
                                    color={isHidden ? "text_secondary" : "text_primary"}
                                    fontWeight="medium"
                                    maxW="180px"
                                    truncate
                                >
                                    {dep.name}
                                </Text>
                                <Text
                                    fontSize="2xs"
                                    color="text_secondary"
                                    fontWeight="semibold"
                                >
                                    {formatMoneyByCurrencyCulture(dep.total, currencyName, 0)}
                                </Text>
                            </Flex>
                        );
                    })}
                </Flex>
            )}
        </Box>
    );
};

export default StackedDepositsChart;