import { Stack } from '@chakra-ui/react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, TooltipValueType, TooltipPayloadEntry } from 'recharts';
import { DistributionModel } from '../../../models/dashboard/DashboardEntity';
import { getChartLabelConfig } from '../../../shared/utilities/chartUtilities';
import { formatMoneyByCurrencyCulture } from '../../../shared/utilities/formatters/moneyFormatter';
import { CHARTS_COLORS } from '../../../shared/constants/chartColors';

type Props = {
    data: DistributionModel[]
    mainCurrency: string
}

const DistributionChart = (props: Props) => {
    const colors = CHARTS_COLORS;

    const formatLabel = (
        _value: TooltipValueType | undefined,
        _name: TooltipValueType | undefined,
        item: TooltipPayloadEntry
    ) => {
        const payload = item?.payload as DistributionModel | undefined;
        if (!payload) return '';
        const { currency, amount, convertedAmount } = payload;

        const convertedValue = formatMoneyByCurrencyCulture(convertedAmount, props.mainCurrency);

        return amount !== convertedAmount ? 
            `${formatMoneyByCurrencyCulture(amount, currency)} (${convertedValue})`:
            convertedValue;
    }

    const chartData = props.data.filter(item => (item.convertedAmount ?? 0) > 0);
    const totalAmount = chartData.reduce((sum, item) => sum + item.convertedAmount, 0);

    return <Stack>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="convertedAmount" nameKey="name">
                    {
                        chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        )) 
                    }
                    </Pie>
                    <Tooltip contentStyle={getChartLabelConfig()} itemStyle={{ color: "var(--chakra-colors-text_primary)" }} formatter={formatLabel}/>
                    <Legend
                        formatter={(value, entry) => {
                            const payload = entry?.payload as (DistributionModel & { value?: number, payload?: DistributionModel }) | undefined;
                            const item = payload?.payload ?? chartData.find(d => d.name === value);
                            const currentValue = item?.convertedAmount ?? payload?.value ?? 0;

                            if (!currentValue || !totalAmount) {
                                return value;
                            }

                            const percent = ((currentValue / totalAmount) * 100).toFixed(1);
                            return `${value} (${percent}%)`;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </Stack>
}

export default DistributionChart;