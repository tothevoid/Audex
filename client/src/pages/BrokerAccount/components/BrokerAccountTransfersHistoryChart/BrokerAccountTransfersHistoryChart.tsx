import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Box, Card, Flex, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { CHART_THEME_COLORS } from "@/shared/constants/chartColors";
import { Nullable } from "@/shared/utilities/nullable";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { MdHistory } from "react-icons/md";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { useBrokerAccountTransfersHistory } from "../../hooks/useBrokerAccountTransfersHistory";
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

    const [hoveredAccountId, setHoveredAccountId] = useState<Nullable<string>>(null);

    const {
        availableDates,
        currentFilter,
        handleFilterChange,
        chartData,
        accountList,
        depositedByPeriod,
        withdrawnByPeriod
    } = useBrokerAccountTransfersHistory({
        brokerAccountId,
        selectedAccountId,
        onAccountChange
    });

    if (!availableDates?.availableYears?.length) {
        return null;
    }

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
                currentFilter={currentFilter}
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
                                    selectedRangeTypeValue={currentFilter.rangeType}
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