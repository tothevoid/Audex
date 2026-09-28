import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { formatPeriodLabel } from "@/pages/Deposits/components/DepositStats/depositChartUtils";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { CHART_THEME_COLORS } from "@/shared/constants/chartColors";
import {
    ChartTooltipContainer,
    ChartTooltipHeader,
    ChartTooltipItem,
} from "@/shared/components/ChartTooltip/ChartTooltip";

interface StackedDepositsTooltipPayloadItem {
    value?: number;
    dataKey?: string | number;
    name?: string;
    fill?: string;
    color?: string;
}

interface Props {
    active?: boolean;
    payload?: StackedDepositsTooltipPayloadItem[];
    label?: string;
    currencyName: string;
    depositsMap: Map<string, string>;
}

const StackedDepositsTooltip: React.FC<Props> = ({
    active,
    payload,
    label,
    currencyName,
    depositsMap,
}) => {
    const { i18n } = useTranslation();

    if (!active || !payload || !payload.length) {
        return null;
    }

    const formattedPeriod = label ? formatPeriodLabel(label, i18n, "full") : "";

    // Filter deposits with positive payout in this month and sort by descending value
    const activeDeposits = payload
        .filter((item): item is StackedDepositsTooltipPayloadItem & { value: number } => typeof item.value === "number" && item.value > 0)
        .sort((a, b) => b.value - a.value);

    const totalMonthSum = activeDeposits.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <ChartTooltipContainer minW="220px" maxW="340px">
            <ChartTooltipHeader
                title={formattedPeriod}
                value={formatMoneyByCurrencyCulture(totalMonthSum, currencyName)}
                valueColor={CHART_THEME_COLORS.earnings}
            />

            {activeDeposits.length > 0 && (
                <Box borderTop="1px solid" borderColor={CHART_THEME_COLORS.divider} pt={2} mt={1}>
                    <Flex direction="column" gap={1.5} maxH="220px" overflowY="auto">
                        {activeDeposits.map((item) => {
                            const depositId = String(item.dataKey ?? "");
                            const depositName = depositsMap.get(depositId) || item.name || depositId;
                            const color = item.fill || item.color || "#38bdf8";

                            return (
                                <ChartTooltipItem
                                    key={depositId}
                                    label={depositName}
                                    value={formatMoneyByCurrencyCulture(item.value, currencyName)}
                                    color={color}
                                />
                            );
                        })}
                    </Flex>
                </Box>
            )}
        </ChartTooltipContainer>
    );
};

export default StackedDepositsTooltip;
