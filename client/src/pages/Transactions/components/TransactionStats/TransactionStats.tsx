import { AccountEntity } from '../../../../models/accounts/AccountEntity'
import { Box, Stack, Text } from '@chakra-ui/react'
import ButtonGroup from '../../../../shared/components/ButtonGroup/ButtonGroup';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, TooltipValueType } from 'recharts';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { getChartLabelConfig } from '../../../../shared/utilities/chartUtilities';
import { useUserProfile } from '../../../../features/UserProfileSettingsModal/hooks/UserProfileContext';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';

type Props = {
    accounts: AccountEntity[]
    transactions: TransactionEntity[],
}

type PieChartData = {
    name: string;
    value: number;
}

type GroupingConfig = {
    group:DataGrouping;
    caption: string;
    dataFunc: (transactions: TransactionEntity[]) => PieChartData[];
}

enum DataGrouping {
    BySource = 0,
    ByType = 1
}


const getGraphData = (transactions: TransactionEntity[],
    keySelector: (transaction: TransactionEntity) => string,
    keyMapping: ((key: string) => string) | null = null) => {
    const data: Array<PieChartData> = []

    transactions
        .filter(transaction => transaction.amount < 0)
        .reduce(
        (accumulator: Map<string, number>, currentValue: TransactionEntity) => {
            const key = keySelector(currentValue);
            let currentQuantity = currentValue.amount * currentValue.account.currency.rate;
            if (accumulator.has(key)) {
                currentQuantity += accumulator.get(key) ?? 0;
            }

            accumulator.set(key, currentQuantity);
            return accumulator;
        }, new Map<string, number>(),
    ).forEach((value, key) => {
        const mappedName = keyMapping ? keyMapping(key): key;
        data.push({name: mappedName, value: Math.abs(value)});
    })
    return data;
}

import { CHARTS_COLORS } from "../../../../shared/constants/chartColors";

const getPossibleColors = () => CHARTS_COLORS;

const getNameMapping = <CollectionType,>(
    collection: Array<CollectionType>,
    keySelector: (item: CollectionType) => string,
    valueSelector: (item: CollectionType) => string) => {
    return collection.reduce((accumulator, item) => {
        accumulator.set(keySelector(item), valueSelector(item));
        return accumulator;
    }, new Map<string, string>());
};

const TransactionStats = (props: Props) => {
    const accountsMapping = getNameMapping(props.accounts, (account) => account.id, (account) => account.name);
    const [selectedGrouping, setSelectedGrouping] = useState(DataGrouping.BySource);
    const [chartData, setChartData] = useState([] as PieChartData[]);
    const { t } = useTranslation();
    const { user } = useUserProfile()

    const groupingConfig = new Map<DataGrouping, GroupingConfig>([
        [ DataGrouping.BySource, {
            group: DataGrouping.BySource,
            caption: t("manager_stats_by_source"),
            dataFunc: (transactions: TransactionEntity[]) => getGraphData(transactions, (transaction) => transaction.account.id,
                (key) => accountsMapping.get(key) ?? "Incorrect source")
        }],
        [ DataGrouping.ByType, {
            group: DataGrouping.ByType,
            caption: t("manager_stats_by_type"),
            dataFunc: (transactions: TransactionEntity[]) => getGraphData(transactions, (transaction) => transaction.transactionType.name)
        }]
    ]);

    useEffect(() => {
        const data = groupingConfig.get(selectedGrouping)?.dataFunc(props.transactions) ?? [];
        setChartData(data);
    }, [props.transactions, selectedGrouping]);


    const colors = getPossibleColors();

    return <Stack>
        <Text fontSize="2xl" fontWeight={600}>{t("manager_stats_title")}</Text>
        <Box padding="25px" borderRadius="10px" background="background_primary" width="100%">
            <Box mb={4}>
                <ButtonGroup<DataGrouping>
                    options={[...groupingConfig.values()].map(config => ({
                        value: config.group,
                        label: config.caption
                    }))}
                    value={selectedGrouping}
                    onChange={(val) => setSelectedGrouping(val)}
                />
            </Box>
            <Box style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                            {
                                chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />))
                            }
                        </Pie>
                        <Tooltip itemStyle={{ color: 'var(--chakra-colors-text_primary)' }} contentStyle={getChartLabelConfig()} formatter={(value: TooltipValueType | undefined, name: TooltipValueType | undefined) => [formatMoneyByCurrencyCulture(Number(value ?? 0), user?.currency.name), String(name ?? '')]} />
                        <Legend/>
                    </PieChart>
                </ResponsiveContainer>
            </Box>
            
        </Box>
    </Stack>
}

export default TransactionStats;