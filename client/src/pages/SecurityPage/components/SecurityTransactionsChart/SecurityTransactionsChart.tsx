import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine, ComposedChart, Bar, TooltipValueType } from "recharts";
import { Box } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTransactionsBySecurity } from "../../../../api/securities/securityTransactionApi";
import { formatShortDateTime } from "../../../../shared/utilities/formatters/dateFormatter";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { getChartLabelConfig } from "../../../../shared/utilities/chartUtilities";
import { SecurityTransactionsHistory } from "../../../../models/securities/SecurityTransactionsHistory";

interface Props {
    securityId: string
    currencyName: string
    currentPrice: number
}

interface State {
    transactions: SecurityTransactionsHistory[],
}

const SecurityTransactionsChart: React.FC<Props> = (props) => {
    const [state, setState] = useState<State>({transactions: []})

    const { t, i18n } = useTranslation();

    const initData = async () => {
        const historyValues = await getTransactionsBySecurity(props.securityId);
        if (!historyValues) {
            return;
        }

        const transactions = historyValues.map(historyValue => {
            historyValue.date = formatShortDateTime(new Date(historyValue.date), i18n);
            return historyValue;
        })

        setState((currentState) => {
            return {...currentState, transactions}
        })
    }

    useEffect(() => {
        initData();
    }, []);

    const formatTooltipValue = useCallback((value: TooltipValueType | undefined, name: TooltipValueType | undefined) => {
        if (String(name) === t("securities_transactions_volume")) {
            return Number(value ?? 0);
        }

        return formatMoneyByCurrencyCulture(Number(value ?? 0), props.currencyName)
    }, [props.currencyName, t]);

    return <Box style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
            <ComposedChart data={state.transactions} margin={{
                    top: 20,
                    bottom: 20,
                }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chakra-colors-border_primary)" />
                <XAxis dataKey="date" stroke="var(--chakra-colors-text_secondary)" />
                <YAxis yAxisId="left" orientation="left" domain={['dataMin - 10', 'dataMax + 10']} stroke="var(--chakra-colors-text_secondary)" />
                <YAxis yAxisId="right" orientation="right" domain={[0, "auto"]} stroke="var(--chakra-colors-text_secondary)" />

                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="valueWithPayments"
                    stroke="var(--chakra-colors-gain)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name={t("securities_transactions_with_dividends")}
                />

                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="valueWithoutPayments"
                    stroke="var(--chakra-colors-status_success)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name={t("securities_transactions_without_dividends")}
                />

                <Bar
                    yAxisId="right"
                    dataKey="volume"
                    barSize={20}
                    fill="var(--chakra-colors-gain)"
                    opacity={0.4}
                    name={t("securities_transactions_volume")}
                />

                <Legend />
                <ReferenceLine yAxisId="left" y={props.currentPrice} stroke="var(--chakra-colors-loss)" strokeDasharray="5 5" label={t("securities_transactions_current_price")} />
                <Tooltip contentStyle={getChartLabelConfig()} formatter={formatTooltipValue} />
            </ComposedChart>
        </ResponsiveContainer>
    </Box>
}

export default SecurityTransactionsChart;