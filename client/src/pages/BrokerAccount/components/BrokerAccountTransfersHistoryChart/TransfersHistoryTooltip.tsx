import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { ChartTooltipContainer, ChartTooltipHeader, ChartTooltipItem } from "../../../../shared/components/ChartTooltip/ChartTooltip";
import { CHART_THEME_COLORS } from "../../../../shared/constants/chartColors";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { AccountItem, MONTH_RANGE, TransfersChartRow } from "./types";

interface Props {
    active?: boolean;
    payload?: any[];
    label?: string;
    selectedRangeTypeValue: string;
    selectedYearValue: number;
    selectedMonthValue: number;
    accountList: AccountItem[];
    currencyName: string;
}

const TransfersHistoryTooltip: React.FC<Props> = ({
    active,
    payload,
    label,
    selectedRangeTypeValue,
    selectedYearValue,
    selectedMonthValue,
    accountList,
    currencyName
}) => {
    const { t } = useTranslation();

    if (!active || !payload || !payload.length) return null;

    const chartRow = payload[0]?.payload as TransfersChartRow | undefined;
    if (!chartRow) return null;

    const periodTitle = selectedRangeTypeValue === MONTH_RANGE
        ? `${label} ${new Date(selectedYearValue, selectedMonthValue - 1, 1).toLocaleString(i18n.language, { month: "short" })} ${selectedYearValue}`
        : `${label} ${selectedYearValue}`;

    const deposits: Array<{ id: string; name: string; amount: number; color: string }> = [];
    const withdrawals: Array<{ id: string; name: string; amount: number; color: string }> = [];

    if (chartRow.accountValues && chartRow.accountValues.length > 0) {
        chartRow.accountValues.forEach((accountValue) => {
            const accountMeta = accountList.find((item) => item.id === accountValue.accountId);
            const accountDisplayName = accountValue.accountName || accountMeta?.name || t("filter_no_category");

            if (accountValue.deposited > 0) {
                deposits.push({
                    id: accountValue.accountId,
                    name: accountDisplayName,
                    amount: accountValue.deposited,
                    color: accountMeta?.color ?? "var(--chakra-colors-gain)"
                });
            }

            if (accountValue.withdrawn > 0) {
                withdrawals.push({
                    id: accountValue.accountId,
                    name: accountDisplayName,
                    amount: accountValue.withdrawn,
                    color: accountMeta?.color ?? "var(--chakra-colors-loss)"
                });
            }
        });
    } else {
        if (chartRow.totalIncome > 0) {
            deposits.push({
                id: "total",
                name: t("broker_account_stats_deposited"),
                amount: chartRow.totalIncome,
                color: "var(--chakra-colors-gain)"
            });
        }

        if (chartRow.totalWithdraw > 0) {
            withdrawals.push({
                id: "total",
                name: t("broker_account_stats_withdrawn"),
                amount: chartRow.totalWithdraw,
                color: "var(--chakra-colors-loss)"
            });
        }
    }

    const totalIncome = chartRow.totalIncome ?? deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const totalWithdraw = chartRow.totalWithdraw ?? withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    const netFlow = totalIncome - totalWithdraw;

    if (deposits.length === 0 && withdrawals.length === 0) {
        return (
            <ChartTooltipContainer minW="180px">
                <ChartTooltipHeader title={periodTitle} />
                <Text fontSize="2xs" color="text_secondary">
                    {t("transfers_history_chart_no_transfers")}
                </Text>
            </ChartTooltipContainer>
        );
    }

    return (
        <ChartTooltipContainer minW="220px">
            <ChartTooltipHeader title={periodTitle} />
            <Box display="flex" flexDirection="column" gap={1.5}>
                {deposits.map((deposit) => (
                    <ChartTooltipItem
                        key={`deposit-${deposit.id}`}
                        label={`${deposit.name} (+)`}
                        value={`+${formatMoneyByCurrencyCulture(deposit.amount, currencyName)}`}
                        color={deposit.color}
                        valueColor="var(--chakra-colors-gain)"
                    />
                ))}
                {withdrawals.map((withdrawal) => (
                    <ChartTooltipItem
                        key={`withdrawal-${withdrawal.id}`}
                        label={`${withdrawal.name} (-)`}
                        value={`-${formatMoneyByCurrencyCulture(withdrawal.amount, currencyName)}`}
                        color={withdrawal.color}
                        valueColor="var(--chakra-colors-loss)"
                    />
                ))}
                <Box borderTopWidth="1px" borderColor={CHART_THEME_COLORS.divider} pt={1.5} mt={0.5}>
                    <ChartTooltipItem
                        label={t("transfers_history_chart_net_flow")}
                        value={`${netFlow > 0 ? "+" : ""}${formatMoneyByCurrencyCulture(netFlow, currencyName)}`}
                        valueColor={netFlow > 0 ? "var(--chakra-colors-gain)" : netFlow < 0 ? "var(--chakra-colors-loss)" : "var(--chakra-colors-text_primary)"}
                        isBold
                    />
                </Box>
            </Box>
        </ChartTooltipContainer>
    );
};

export default TransfersHistoryTooltip;
