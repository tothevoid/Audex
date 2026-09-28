import React, { useCallback, useMemo } from "react";
import { Box } from "@chakra-ui/react";
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
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { formatChartAxisDate, ChartPeriod } from "@/shared/utilities/formatters/dateFormatter";
import SecurityHistoryChartTooltip from "./SecurityHistoryChartTooltip";

export interface ProcessedHistoryItem {
    rawDate: Date;
    dateIso: string;
    formattedFullDate: string;
    value: number;
}

interface Props {
    data: ProcessedHistoryItem[];
    startPrice: number;
    avgPrice: number;
    isPositive: boolean;
    currencyName: string;
    selectedPeriod: ChartPeriod;
}

const SecurityHistoryChart: React.FC<Props> = ({
    data,
    startPrice,
    avgPrice,
    isPositive,
    currencyName,
    selectedPeriod,
}) => {
    const { i18n } = useTranslation();

    const xTicks = useMemo(() => {
        if (!data.length) return [];
        if (data.length <= 6) return data.map((p) => p.dateIso);
        const count = Math.min(6, data.length);
        const step = (data.length - 1) / (count - 1);
        const result: string[] = [];
        for (let i = 0; i < count; i++) {
            const index = Math.round(i * step);
            result.push(data[index].dateIso);
        }
        return result;
    }, [data]);

    const renderCustomXAxisTick = useCallback((props: any) => {
        const { x, y, payload, index } = props;
        if (!payload || !payload.value) return null;
        const text = formatChartAxisDate(new Date(payload.value), selectedPeriod, i18n);

        let textAnchor: "start" | "middle" | "end" = "middle";
        let dx = 0;
        if (index === 0) {
            textAnchor = "start";
            dx = 4;
        } else if (index === xTicks.length - 1) {
            textAnchor = "end";
            dx = -4;
        }

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={dx}
                    y={0}
                    dy={12}
                    textAnchor={textAnchor}
                    fill="var(--chakra-colors-text_secondary)"
                    fontSize={11}
                >
                    {text}
                </text>
            </g>
        );
    }, [selectedPeriod, i18n, xTicks.length]);

    const strokeColor = isPositive
        ? "var(--chakra-colors-pnl_positive)"
        : "var(--chakra-colors-pnl_negative)";

    return (
        <Box width="100%" height="380px" mt={2}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 15, right: 15, left: 15, bottom: 15 }}
                >
                    <defs>
                        <linearGradient id="securityHistoryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.28} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--chakra-colors-border_primary)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="dateIso"
                        ticks={xTicks}
                        tick={renderCustomXAxisTick}
                        tickLine={false}
                        axisLine={{ stroke: "var(--chakra-colors-border_primary)" }}
                    />
                    <YAxis
                        width={85}
                        domain={['auto', 'auto']}
                        stroke="var(--chakra-colors-text_secondary)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: "var(--chakra-colors-border_primary)" }}
                        dx={-4}
                        tickFormatter={(val: number) => formatMoneyByCurrencyCulture(val, currencyName, 2)}
                    />
                    <Tooltip
                        content={
                            <SecurityHistoryChartTooltip
                                currencyName={currencyName}
                                startPrice={startPrice}
                                period={selectedPeriod}
                                i18n={i18n}
                            />
                        }
                    />
                    <ReferenceLine
                        y={avgPrice}
                        stroke="var(--chakra-colors-border_primary)"
                        strokeDasharray="4 4"
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#securityHistoryGradient)"
                        activeDot={{
                            r: 6,
                            fill: strokeColor,
                            stroke: "var(--chakra-colors-background_primary)",
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default SecurityHistoryChart;
