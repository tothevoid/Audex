import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, TooltipPayloadEntry, TooltipValueType } from 'recharts';
import { DistributionModel } from '@/models/dashboard/DashboardEntity';
import { getChartLabelConfig } from '@/shared/utilities/chartUtilities';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import { CHARTS_COLORS } from '@/shared/constants/chartColors';
import { Nullable } from '@/shared/utilities/nullable';
import { DistributionLegend } from './DistributionLegend';

interface Props {
    data: DistributionModel[];
    mainCurrency: string;
    height?: number | string;
    outerRadius?: number | string;
    innerRadius?: number | string;
}

const DistributionChart: React.FC<Props> = ({
    data,
    mainCurrency,
    outerRadius = "85%",
    innerRadius = "48%"
}) => {
    const [activeIndex, setActiveIndex] = useState<Nullable<number>>(null);

    // Filter valid positive amounts and sort descending so largest slices are first
    const chartData = data
        .filter(item => (item.convertedAmount ?? 0) > 0)
        .sort((firstItem, secondItem) => (secondItem.convertedAmount ?? 0) - (firstItem.convertedAmount ?? 0));

    const totalAmount = chartData.reduce((sum, item) => sum + item.convertedAmount, 0);

    const hasSmallSlices = chartData.some(
        item => totalAmount > 0 && (item.convertedAmount / totalAmount) < 0.035
    );
    const paddingAngle = hasSmallSlices || chartData.length <= 1 ? 0 : 1.5;

    const formatLabel = (
        _value: TooltipValueType | undefined,
        _name: TooltipValueType | undefined,
        entry: TooltipPayloadEntry
    ) => {
        const payload = entry?.payload as DistributionModel | undefined;
        if (!payload) return '';
        const { currency, amount, convertedAmount } = payload;
        const convertedValue = formatMoneyByCurrencyCulture(convertedAmount, mainCurrency);

        return amount !== convertedAmount
            ? `${formatMoneyByCurrencyCulture(amount, currency)} (${convertedValue})`
            : convertedValue;
    };

    if (chartData.length === 0) {
        return null;
    }

    return (
        <Flex direction="column" gap={2} w="100%" h="100%" flex="1" overflow="hidden">
            {/* Donut Chart Canvas with dedicated guaranteed SVG space */}
            <Box w="100%" flex="1" minH="140px" position="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={paddingAngle}
                            dataKey="convertedAmount"
                            nameKey="name"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={CHARTS_COLORS[index % CHARTS_COLORS.length]}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                                    stroke="var(--chakra-colors-background_primary)"
                                    strokeWidth={1}
                                    style={{
                                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={getChartLabelConfig()}
                            itemStyle={{ color: "var(--chakra-colors-text_primary)" }}
                            formatter={formatLabel}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </Box>

            {/* Custom Interactive HTML Legend */}
            <DistributionLegend
                items={chartData}
                totalAmount={totalAmount}
                mainCurrency={mainCurrency}
                activeIndex={activeIndex}
                onItemHover={setActiveIndex}
                onItemLeave={() => setActiveIndex(null)}
            />
        </Flex>
    );
};

export default DistributionChart;