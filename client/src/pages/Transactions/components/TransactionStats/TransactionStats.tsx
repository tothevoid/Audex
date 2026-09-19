import React, { useEffect, useState } from 'react';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { Box, Flex, Stack, Text, Progress, Badge } from '@chakra-ui/react';
import ButtonGroup from '../../../../shared/components/ButtonGroup/ButtonGroup';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, TooltipValueType } from 'recharts';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { getChartLabelConfig } from '../../../../shared/utilities/chartUtilities';
import { useUserProfile } from '../../../../features/UserProfileSettingsModal/hooks/UserProfileContext';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { CHARTS_COLORS } from '../../../../shared/constants/chartColors';
import { TypeFilterMode } from '../TransactionFilterBar/TransactionFilterBar';

export type TransactionStatsProps = {
    accounts: AccountEntity[];
    transactions: TransactionEntity[];
    typeFilter: TypeFilterMode;
    selectedCategoryId?: string;
    onCategoryClick?: (categoryId: string) => void;
    selectedAccountId?: string;
    onAccountClick?: (accountId: string) => void;
};

type PieChartData = {
    id: string;
    name: string;
    value: number;
    color?: string;
};

export enum DataGrouping {
    ByType = 0,
    BySource = 1,
}

const getGraphData = (
    transactions: TransactionEntity[],
    itemSelector: (transaction: TransactionEntity) => { id: string; name: string }
): PieChartData[] => {
    const accumulator = new Map<string, { name: string; value: number }>();

    transactions.forEach((currentValue) => {
        const { id, name } = itemSelector(currentValue);
        const rate = currentValue.account.currency.rate || 1;
        const currentQuantity = Math.abs(currentValue.amount * rate);

        const existing = accumulator.get(id);
        if (existing) {
            existing.value += currentQuantity;
        } else {
            accumulator.set(id, { name, value: currentQuantity });
        }
    });

    const data: PieChartData[] = [];
    accumulator.forEach(({ name, value }, id) => {
        data.push({ id, name, value });
    });

    return data.sort((a, b) => b.value - a.value);
};

const TransactionStats: React.FC<TransactionStatsProps> = ({
    accounts,
    transactions,
    typeFilter,
    selectedCategoryId,
    onCategoryClick,
    selectedAccountId,
    onAccountClick,
}) => {
    const accountsMap = new Map(accounts.map((acc) => [acc.id, acc.name]));
    const [selectedGrouping, setSelectedGrouping] = useState(DataGrouping.ByType);
    const [chartData, setChartData] = useState<PieChartData[]>([]);
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const colors = CHARTS_COLORS;

    const isIncomeMode = typeFilter === 'income';
    const activeId = selectedGrouping === DataGrouping.ByType ? selectedCategoryId : selectedAccountId;

    const handleItemClick = (id: string) => {
        if (selectedGrouping === DataGrouping.ByType) {
            onCategoryClick?.(id);
        } else {
            onAccountClick?.(id);
        }
    };

    useEffect(() => {
        let data: PieChartData[] = [];

        if (selectedGrouping === DataGrouping.ByType) {
            data = getGraphData(
                transactions,
                (trx) => ({
                    id: trx.transactionType?.id || 'none',
                    name: trx.transactionType?.name || t('filter_no_category'),
                })
            );
        } else {
            data = getGraphData(
                transactions,
                (trx) => ({
                    id: trx.account.id,
                    name: trx.account.name || accountsMap.get(trx.account.id) || 'Other',
                })
            );
        }

        const styledData = data.map((item, index) => ({
            ...item,
            color: colors[index % colors.length],
        }));

        setChartData(styledData);
    }, [transactions, selectedGrouping, typeFilter]);

    const totalSum = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Stack gap={4}>
            <Text fontSize="xl" fontWeight={700} color="text_primary">
                {t('manager_stats_title')}
            </Text>

            <Box
                p={5}
                borderRadius="xl"
                backgroundColor="background_primary"
                borderColor="border_primary"
                borderWidth="1px"
                boxShadow="xs"
            >
                {/* Grouping Toggle synced with main filter */}
                <Flex direction="column" gap={3} mb={5}>
                    <ButtonGroup<DataGrouping>
                        options={[
                            { value: DataGrouping.ByType, label: t('manager_stats_by_type') },
                            { value: DataGrouping.BySource, label: t('manager_stats_by_source') },
                        ]}
                        value={selectedGrouping}
                        onChange={(val) => setSelectedGrouping(val)}
                    />
                </Flex>

                {/* Donut Chart with Centered Metric */}
                {chartData.length > 0 ? (
                    <>
                        <Box position="relative" w="100%" h={260}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="value"
                                        onClick={(entry) => {
                                            const clicked = entry as unknown as PieChartData;
                                            if (clicked?.id) {
                                                handleItemClick(clicked.id);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry, index) => {
                                            const isSelected = !!activeId && activeId === entry.id;
                                            return (
                                                <Cell
                                                    key={`cell-${entry.id || index}`}
                                                    fill={entry.color}
                                                    stroke={isSelected ? 'var(--chakra-colors-text_primary)' : 'none'}
                                                    strokeWidth={isSelected ? 3 : 0}
                                                />
                                            );
                                        })}
                                    </Pie>
                                    <Tooltip
                                        itemStyle={{ color: 'var(--chakra-colors-text_primary)' }}
                                        contentStyle={getChartLabelConfig()}
                                        formatter={(value: TooltipValueType | undefined, name: TooltipValueType | undefined) => [
                                            formatMoneyByCurrencyCulture(Number(value ?? 0), user?.currency.name),
                                            String(name ?? ''),
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center total readout */}
                            <Flex
                                position="absolute"
                                top="50%"
                                left="50%"
                                transform="translate(-50%, -50%)"
                                direction="column"
                                align="center"
                                justify="center"
                                pointerEvents="none"
                            >
                                <Text fontSize="2xs" color="text_secondary" fontWeight={500}>
                                    {isIncomeMode ? t('stats_total_income') : t('stats_total_spent')}
                                </Text>
                                <Text fontSize="md" fontWeight={700} color="text_primary">
                                    {formatMoneyByCurrencyCulture(totalSum, user?.currency.name)}
                                </Text>
                            </Flex>
                        </Box>

                        {/* Top breakdown list */}
                        <Stack gap={2} mt={4} maxH={300} overflowY="auto" pr={1}>
                            {chartData.map((item) => {
                                const percent = totalSum > 0 ? (item.value / totalSum) * 100 : 0;
                                const isSelected = !!activeId && activeId === item.id;

                                return (
                                    <Box
                                        key={item.id}
                                        p={2.5}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={isSelected ? 'action_primary' : 'transparent'}
                                        backgroundColor={isSelected ? 'status_info_bg' : 'transparent'}
                                        transition="all 0.15s ease-in-out"
                                        _hover={{ bg: isSelected ? 'status_info_bg' : 'background_secondary', cursor: 'pointer' }}
                                        onClick={() => handleItemClick(item.id)}
                                    >
                                        <Flex justify="space-between" align="center" mb={1}>
                                            <Flex align="center" gap={2}>
                                                <Box w={3} h={3} borderRadius="full" bg={item.color} />
                                                <Text fontSize="xs" fontWeight={isSelected ? 700 : 600} color="text_primary">
                                                    {item.name}
                                                </Text>
                                                {isSelected && (
                                                    <Badge size="xs" colorPalette="blue" variant="solid">
                                                        {t('filter_active')}
                                                    </Badge>
                                                )}
                                            </Flex>
                                            <Flex align="center" gap={2}>
                                                <Text fontSize="2xs" color="text_secondary">
                                                    {percent.toFixed(1)}%
                                                </Text>
                                                <Text fontSize="xs" fontWeight={700} color="text_primary">
                                                    {formatMoneyByCurrencyCulture(item.value, user?.currency.name)}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Progress.Root value={percent} size="xs">
                                            <Progress.Track bg="background_secondary">
                                                <Progress.Range bg={item.color} />
                                            </Progress.Track>
                                        </Progress.Root>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </>
                ) : (
                    <Flex h={200} align="center" justify="center">
                        <Text fontSize="xs" color="text_secondary">
                            {t('stats_no_data')}
                        </Text>
                    </Flex>
                )}
            </Box>
        </Stack>
    );
};

export default TransactionStats;