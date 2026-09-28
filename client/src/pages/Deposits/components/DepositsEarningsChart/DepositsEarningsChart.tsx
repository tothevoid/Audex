import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { DepositMonthSummary } from "@/pages/Deposits/components/DepositStats/depositMonthSummary";
import { Box } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { formatPeriodLabel } from "@/pages/Deposits/components/DepositStats/depositChartUtils";
import { CHART_THEME_COLORS } from "@/shared/constants/chartColors";
import DepositsEarningsTooltip from "./DepositsEarningsTooltip";

interface Props {
    data: DepositMonthSummary;
    currencyName: string;
}

const DepositsEarningsChart: React.FC<Props> = ({ data, currencyName }) => {
    const { i18n } = useTranslation();

    const chartData = useMemo(() => {
        if (!data?.payments) return [];
        return data.payments.map((payment) => ({
            date: payment.period,
            value: payment.totalValue,
        }));
    }, [data]);

    return (
        <Box width="100%" height="360px" mt={2}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 15,
                        right: 20,
                        left: 10,
                        bottom: 10,
                    }}
                >
                    <defs>
                        <linearGradient id="depositEarningsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_THEME_COLORS.earnings} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={CHART_THEME_COLORS.earnings} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
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
                        content={<DepositsEarningsTooltip currencyName={currencyName} />}
                        cursor={{ stroke: CHART_THEME_COLORS.cursorStroke, strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={CHART_THEME_COLORS.earnings}
                        strokeWidth={2.5}
                        fill="url(#depositEarningsGradient)"
                        fillOpacity={1}
                        activeDot={{
                            r: 6,
                            fill: CHART_THEME_COLORS.earnings,
                            stroke: CHART_THEME_COLORS.tooltipBg,
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default DepositsEarningsChart;