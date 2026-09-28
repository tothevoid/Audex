import React from "react";
import { useTranslation } from "react-i18next";
import { formatPeriodLabel } from "@/pages/Deposits/components/DepositStats/depositChartUtils";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { CHART_THEME_COLORS } from "@/shared/constants/chartColors";
import {
    ChartTooltipContainer,
    ChartTooltipHeader,
    ChartTooltipItem,
} from "@/shared/components/ChartTooltip/ChartTooltip";

interface Props {
    active?: boolean;
    payload?: any[];
    label?: string;
    currencyName: string;
}

const DepositsEarningsTooltip: React.FC<Props> = ({ active, payload, label, currencyName }) => {
    const { i18n, t } = useTranslation();

    if (!active || !payload || !payload.length) {
        return null;
    }

    const item = payload[0];
    const value = typeof item.value === "number" ? item.value : 0;
    const formattedPeriod = label ? formatPeriodLabel(label, i18n, "full") : "";

    return (
        <ChartTooltipContainer minW="180px">
            <ChartTooltipHeader title={formattedPeriod} />
            <ChartTooltipItem
                label={t("earnings_chart_data_title")}
                value={formatMoneyByCurrencyCulture(value, currencyName)}
                color={CHART_THEME_COLORS.earnings}
                valueColor={CHART_THEME_COLORS.earnings}
                isBold
            />
        </ChartTooltipContainer>
    );
};

export default DepositsEarningsTooltip;
