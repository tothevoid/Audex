
import React, { useEffect, useMemo, useState } from "react";

import { BrokerAccountDayTransferEntity } from "../../../../models/brokers/BrokerAccountDayTransferEntity";
import { BrokerAccountMonthTransferEntity } from "../../../../models/brokers/BrokerAccountMonthTransferEntity";
import { getMonthTransfersHistory, getYearTransfersHistory } from "../../../../api/brokers/brokerAccountSummaryApi";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Box, Flex, SimpleGrid } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import BaseSelect from "../../../../shared/components/BaseSelect/BaseSelect";
import { getChartLabelConfig } from "../../../../shared/utilities/chartUtilities";
import { Nullable } from "../../../../shared/utilities/nullable";
import MoneyCard from "../../../../shared/components/MoneyCard/MoneyCard";

interface Props {
    brokerAccountId: Nullable<string>;
    currencyName: string
}

const YEAR_RANGE = "YEAR_RANGE";
const MONTH_RANGE = "MONTH_RANGE";

interface RangeType {
    label: string;
    value: string;
}

interface NumericOption {
    label: string
    value: number
}

interface ChartDataItem {
    name: string
    income: number
    withdraw: number
};

const BrokerAccountTransfersHistoryChart: React.FC<Props> = ({ brokerAccountId, currencyName }) => {
    const { t } = useTranslation();

    const rangeTypes: RangeType[] = useMemo(
        () => [
            { label: t("transfers_history_chart_range_year"), value: YEAR_RANGE },
            { label: t("transfers_history_chart_range_month"), value: MONTH_RANGE }
        ],
        [i18n.language, t]
    );

    const months: NumericOption[] = useMemo(
        () => Array.from({ length: 12 }, (_, i) => ({
            label: new Date(0, i).toLocaleString(i18n.language, { month: "short" }),
            value: i + 1
        })),
        [i18n.language]
    );

    const years: NumericOption[] = useMemo(
        () => Array.from({ length: 5 }, (_, i) => ({
            label: (new Date().getFullYear() - i).toString(),
            value: new Date().getFullYear() - i
        })),
        []
    );

    const [transfers, setTransfers] = useState<Array<BrokerAccountDayTransferEntity | BrokerAccountMonthTransferEntity>>([]);
   
    const [chartData, setChartData] = useState<ChartDataItem[]>([]);

    const [selectedRangeType, selectRangeType] = useState<RangeType>(rangeTypes[0]);
    const [selectedYear, selectYear] = useState<NumericOption>(years[0]);
    const [selectedMonth, selectMonth] = useState<NumericOption>(months[0]);

    const [depositedByPeriod, setDepositedByPeriod] = useState<number>(0);
    const [withdrawnByPeriod, setWithdrawnByPeriod] = useState<number>(0);

    useEffect(() => {
        const fetchTransfers = async () => {
            if (selectedRangeType?.value === MONTH_RANGE) {
                const data = await getMonthTransfersHistory(brokerAccountId,
                    selectedMonth.value, selectedYear.value);
                setTransfers(data);
            } else {
                const data = await getYearTransfersHistory(brokerAccountId,
                    selectedYear.value);
                setTransfers(data);
            }
        };
        fetchTransfers();
    }, [brokerAccountId, selectedMonth, selectedYear, selectedRangeType]);

    useEffect(() => {
        let deposited = 0;
        let withdrawn = 0;

        let data: ChartDataItem[] = [];
        if (selectedRangeType?.value === MONTH_RANGE) {
            data = (transfers as BrokerAccountDayTransferEntity[]).map(tr => {
                deposited += tr.totalDeposited;
                withdrawn += tr.totalWithdrawn

                return {
                    name: tr.dayIndex?.toString(),
                    income: tr.totalDeposited,
                    withdraw: tr.totalWithdrawn
                };
            });
        } else {
            data = (transfers as BrokerAccountMonthTransferEntity[]).map(tr => {
                deposited += tr.totalDeposited;
                withdrawn += tr.totalWithdrawn

                return {
                    name: new Date(selectedYear.value, tr.monthIndex - 1, 1)
                        .toLocaleString(i18n.language, { month: "long" }),
                    income: tr.totalDeposited,
                    withdraw: tr.totalWithdrawn
                }
            });
        }

        setDepositedByPeriod(deposited);
        setWithdrawnByPeriod(withdrawn);
        setChartData(data);
    }, [selectedRangeType, transfers, selectedYear]);
   
    const onRangeSelected = (range: RangeType) => selectRangeType(range);
    const onYearSelected = (year: NumericOption) => selectYear(year);
    const onMonthSelected = (month: NumericOption) => selectMonth(month);

    return (
        <Box style={{ width: '100%', height: 650, marginBlock: 20 }}>
            <Flex mb={4} gap={4} width={550}>
                <BaseSelect placeholder="Select range"
                    selectedValue={selectedRangeType}
                    collection={rangeTypes}
                    onSelected={onRangeSelected}
                    labelSelector={(range => range.label)} 
                    valueSelector={(range => range.value)}/>
                <BaseSelect placeholder="Year"
                    selectedValue={selectedYear}
                    collection={years}
                    onSelected={onYearSelected}
                    labelSelector={(range => range.label)} 
                    valueSelector={(range => range.value)}/>
                {
                    selectedRangeType.value === MONTH_RANGE && <BaseSelect placeholder="Month"
                        selectedValue={selectedMonth}
                        collection={months}
                        onSelected={onMonthSelected}
                        labelSelector={(range => range.label)} 
                        valueSelector={(range => range.value)}/>
                }
            </Flex>
            <SimpleGrid columns={2} gap={4}>
                <MoneyCard title={t("broker_account_stats_deposited")} value={depositedByPeriod} currency={currencyName}/>
                <MoneyCard title={t("broker_account_stats_withdrawn")} value={withdrawnByPeriod} currency={currencyName}/>
            </SimpleGrid>
            <ResponsiveContainer height={500}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chakra-colors-border_primary)" />
                    <XAxis dataKey="name" stroke="var(--chakra-colors-text_secondary)" />
                    <YAxis stroke="var(--chakra-colors-text_secondary)" />
                    <Tooltip contentStyle={getChartLabelConfig()} />
                    <Legend />
                    <Bar dataKey="income" fill="var(--chakra-colors-gain)" name={t('broker_account_stats_deposited')} />
                    <Bar dataKey="withdraw" fill="var(--chakra-colors-loss)" name={t('broker_account_stats_withdrawn')} />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default BrokerAccountTransfersHistoryChart;