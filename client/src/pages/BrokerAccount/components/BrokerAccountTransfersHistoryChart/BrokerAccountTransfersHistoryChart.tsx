import React, { useEffect, useMemo, useState, useCallback } from "react";
import { BrokerAccountDayTransferEntity } from "../../../../models/brokers/BrokerAccountDayTransferEntity";
import { BrokerAccountMonthTransferEntity } from "../../../../models/brokers/BrokerAccountMonthTransferEntity";
import { BrokerAccountMonthTransfersHistoryEntity } from "../../../../models/brokers/BrokerAccountMonthTransfersHistoryEntity";
import { BrokerAccountYearTransfersHistoryEntity } from "../../../../models/brokers/BrokerAccountYearTransfersHistoryEntity";
import { BrokerAccountTransfersAvailableDatesEntity } from "../../../../models/brokers/BrokerAccountTransfersAvailableDatesEntity";
import { BrokerAccountEntity } from "../../../../models/brokers/BrokerAccountEntity";
import {
    getMonthTransfersHistory,
    getYearTransfersHistory,
    getTransfersAvailableDates
} from "../../../../api/brokers/brokerAccountSummaryApi";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Box, Card, Flex, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { CHART_THEME_COLORS, getChartColor } from "../../../../shared/constants/chartColors";
import { Nullable } from "../../../../shared/utilities/nullable";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { MdHistory } from "react-icons/md";
import { AccountItem, MONTH_RANGE, TransfersChartRow, TransfersHistoryFilterState, YEAR_RANGE } from "./types";
import TransfersHistoryFilterBar from "./TransfersHistoryFilterBar";
import TransfersHistoryPeriodStats from "./TransfersHistoryPeriodStats";
import TransfersHistoryTooltip from "./TransfersHistoryTooltip";
import TransfersHistoryLegend from "./TransfersHistoryLegend";

interface Props {
    brokerAccountId?: Nullable<string>;
    selectedAccountId?: Nullable<string>;
    onAccountChange?: (accountId: Nullable<string>) => void;
    brokerAccounts?: BrokerAccountEntity[];
    currencyName: string;
}

const BrokerAccountTransfersHistoryChart: React.FC<Props> = ({
    brokerAccountId,
    selectedAccountId,
    onAccountChange,
    brokerAccounts = [],
    currencyName
}) => {
    const { t } = useTranslation();

    const effectiveAccountId = brokerAccountId ?? selectedAccountId;

    const [availableDates, setAvailableDates] = useState<BrokerAccountTransfersAvailableDatesEntity | null>(null);
    const [currentFilter, setCurrentFilter] = useState<TransfersHistoryFilterState>({
        rangeType: { label: t("transfers_history_chart_range_year"), value: YEAR_RANGE },
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        accountId: effectiveAccountId
    });

    const [periodHistory, setPeriodHistory] = useState<Nullable<BrokerAccountMonthTransfersHistoryEntity | BrokerAccountYearTransfersHistoryEntity>>(null);
    const [hoveredAccountId, setHoveredAccountId] = useState<Nullable<string>>(null);

    // Fetch available dates from database when effective account changes
    useEffect(() => {
        let isMounted = true;
        const fetchDates = async () => {
            const data = await getTransfersAvailableDates(effectiveAccountId);
            if (isMounted && data) {
                setAvailableDates(data);
            }
        };

        fetchDates();

        return () => {
            isMounted = false;
        };
    }, [effectiveAccountId]);

    // Handle single filter change event from child component
    const handleFilterChange = useCallback(
        (newFilter: TransfersHistoryFilterState) => {
            setCurrentFilter(newFilter);
            if (onAccountChange && newFilter.accountId !== selectedAccountId) {
                onAccountChange(newFilter.accountId);
            }
        },
        [onAccountChange, selectedAccountId]
    );

    // Fetch pre-aggregated transfers data from backend
    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            const targetAccountId = brokerAccountId ?? currentFilter.accountId;
            if (currentFilter.rangeType.value === MONTH_RANGE) {
                const data = await getMonthTransfersHistory(targetAccountId, currentFilter.month, currentFilter.year);
                if (isMounted) {
                    setPeriodHistory(data ?? null);
                }
            } else {
                const data = await getYearTransfersHistory(targetAccountId, currentFilter.year);
                if (isMounted) {
                    setPeriodHistory(data ?? null);
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [brokerAccountId, currentFilter.accountId, currentFilter.rangeType.value, currentFilter.year, currentFilter.month]);

    // Calculate chart rows, account list and period totals from backend response
    const { chartData, accountList, depositedByPeriod, withdrawnByPeriod } = useMemo(() => {
        if (!periodHistory) {
            return {
                chartData: [],
                accountList: [],
                depositedByPeriod: 0,
                withdrawnByPeriod: 0
            };
        }

        const isMonth = currentFilter.rangeType.value === MONTH_RANGE;
        const rawItems = isMonth
            ? (periodHistory as BrokerAccountMonthTransfersHistoryEntity).days ?? []
            : (periodHistory as BrokerAccountYearTransfersHistoryEntity).months ?? [];

        const rows: TransfersChartRow[] = rawItems.map((item) => {
            const name = isMonth
                ? String((item as BrokerAccountDayTransferEntity).dayIndex)
                : new Date(currentFilter.year, (item as BrokerAccountMonthTransferEntity).monthIndex - 1, 1).toLocaleString(i18n.language, { month: "short" });

            const row: TransfersChartRow = {
                name,
                totalIncome: item.totalDeposited,
                totalWithdraw: item.totalWithdrawn,
                accountValues: item.accountValues ?? []
            };

            if (item.accountValues && item.accountValues.length > 0) {
                item.accountValues.forEach((accountValue) => {
                    row[`income_${accountValue.accountId}`] = accountValue.deposited;
                    row[`withdraw_${accountValue.accountId}`] = accountValue.withdrawn;
                });
            }

            return row;
        });

        const accounts: AccountItem[] = (periodHistory.accounts ?? []).map((accountValue, accountIndex) => ({
            id: accountValue.accountId,
            name: accountValue.accountName || t("filter_no_category"),
            color: getChartColor(accountIndex),
            deposited: accountValue.deposited,
            withdrawn: accountValue.withdrawn
        }));

        return {
            chartData: rows,
            accountList: accounts,
            depositedByPeriod: periodHistory.totalDeposited,
            withdrawnByPeriod: periodHistory.totalWithdrawn
        };
    }, [periodHistory, currentFilter.rangeType.value, currentFilter.year, i18n.language, t]);

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            boxShadow="sm"
            p={5}
        >
            {/* Header: Title */}
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <HStack gap={2.5}>
                    <Box
                        w="32px"
                        h="32px"
                        borderRadius="md"
                        backgroundColor="status_info_bg"
                        color="status_info"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <MdHistory size={18} />
                    </Box>
                    <Text fontSize="md" fontWeight={700} color="text_primary">
                        {t("transfers_history_chart_title")}
                    </Text>
                </HStack>
            </Flex>

            {/* Self-contained Filter Component */}
            <TransfersHistoryFilterBar
                brokerAccountId={brokerAccountId}
                brokerAccounts={brokerAccounts}
                availableDates={availableDates}
                onFilterChange={handleFilterChange}
            />

            {/* Period Summary Metric Strip under Filter */}
            <TransfersHistoryPeriodStats
                depositedByPeriod={depositedByPeriod}
                withdrawnByPeriod={withdrawnByPeriod}
                currencyName={currencyName}
            />

            {/* Recharts BarChart */}
            <Box width="100%" height="380px" mt={2}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME_COLORS.grid} vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={{ stroke: CHART_THEME_COLORS.axisLine }}
                            tick={{ fill: CHART_THEME_COLORS.axisText, fontSize: 11 }}
                            dy={6}
                        />
                        <YAxis
                            width={80}
                            tickLine={false}
                            axisLine={{ stroke: CHART_THEME_COLORS.axisLine }}
                            tick={{ fill: CHART_THEME_COLORS.axisText, fontSize: 11 }}
                            tickFormatter={(amountValue: number) => formatMoneyByCurrencyCulture(amountValue, currencyName, 0)}
                            dx={-4}
                        />
                        <Tooltip
                            content={
                                <TransfersHistoryTooltip
                                    selectedRangeTypeValue={currentFilter.rangeType.value}
                                    selectedYearValue={currentFilter.year}
                                    selectedMonthValue={currentFilter.month}
                                    accountList={accountList}
                                    currencyName={currencyName}
                                />
                            }
                            cursor={{ fill: CHART_THEME_COLORS.cursorFill, opacity: 0.3 }}
                        />

                        {accountList.length > 0 ? (
                            accountList.map((account, accountIndex) => {
                                const isHovered = hoveredAccountId === account.id;
                                const hasAnyHover = hoveredAccountId !== null;
                                const opacity = hasAnyHover ? (isHovered ? 1 : 0.25) : 0.9;

                                return (
                                    <Bar
                                        key={`income_${account.id}`}
                                        dataKey={`income_${account.id}`}
                                        name={`${account.name} (${t("broker_account_stats_deposited")})`}
                                        stackId="income"
                                        fill={account.color}
                                        fillOpacity={opacity}
                                        maxBarSize={36}
                                        radius={accountIndex === accountList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                        onMouseEnter={() => setHoveredAccountId(account.id)}
                                        onMouseLeave={() => setHoveredAccountId(null)}
                                    />
                                );
                            })
                        ) : (
                            <Bar
                                dataKey="totalIncome"
                                name={t("broker_account_stats_deposited")}
                                fill="var(--chakra-colors-gain)"
                                maxBarSize={36}
                                radius={[4, 4, 0, 0]}
                            />
                        )}

                        {accountList.length > 0 ? (
                            accountList.map((account, accountIndex) => {
                                const isHovered = hoveredAccountId === account.id;
                                const hasAnyHover = hoveredAccountId !== null;
                                const opacity = hasAnyHover ? (isHovered ? 0.8 : 0.2) : 0.6;

                                return (
                                    <Bar
                                        key={`withdraw_${account.id}`}
                                        dataKey={`withdraw_${account.id}`}
                                        name={`${account.name} (${t("broker_account_stats_withdrawn")})`}
                                        stackId="withdraw"
                                        fill={account.color}
                                        fillOpacity={opacity}
                                        maxBarSize={36}
                                        radius={accountIndex === accountList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                        onMouseEnter={() => setHoveredAccountId(account.id)}
                                        onMouseLeave={() => setHoveredAccountId(null)}
                                    />
                                );
                            })
                        ) : (
                            <Bar
                                dataKey="totalWithdraw"
                                name={t("broker_account_stats_withdrawn")}
                                fill="var(--chakra-colors-loss)"
                                maxBarSize={36}
                                radius={[4, 4, 0, 0]}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Interactive Accounts Legend Pills */}
            <TransfersHistoryLegend
                accountList={accountList}
                hoveredAccountId={hoveredAccountId}
                onHoverChanged={setHoveredAccountId}
                currencyName={currencyName}
            />
        </Card.Root>
    );
};

export default BrokerAccountTransfersHistoryChart;