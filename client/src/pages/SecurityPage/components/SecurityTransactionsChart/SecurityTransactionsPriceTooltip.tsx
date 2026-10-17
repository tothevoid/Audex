import React from "react";
import { useTranslation } from "react-i18next";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { formatDate } from "@/shared/utilities/formatters/dateFormatter";
import { SecurityTransactionsHistory } from "@/models/securities/SecurityTransactionsHistory";
import {
    ChartTooltipContainer,
    ChartTooltipHeader,
    ChartTooltipItem,
} from "@/shared/components/ChartTooltip/ChartTooltip";

interface TooltipPayloadItem {
    payload: SecurityTransactionsHistory;
    value: number;
    dataKey: string;
}

interface Props {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    currencyName: string;
}

export const SecurityTransactionsPriceTooltip: React.FC<Props> = ({
    active,
    payload,
    currencyName,
}) => {
    const { t, i18n } = useTranslation();

    if (!active || !payload || !payload.length) {
        return null;
    }

    const currentPoint = payload[0].payload;
    const formattedDate = formatDate(new Date(currentPoint.date), i18n);

    return (
        <ChartTooltipContainer minW="220px">
            <ChartTooltipHeader title={formattedDate} />
            <ChartTooltipItem
                label={t("securities_transactions_with_dividends")}
                value={formatMoneyByCurrencyCulture(
                    currentPoint.valueWithPayments,
                    currencyName,
                    2
                )}
                color="#10B981"
                isBold={true}
            />
            <ChartTooltipItem
                label={t("securities_transactions_without_dividends")}
                value={formatMoneyByCurrencyCulture(
                    currentPoint.valueWithoutPayments,
                    currencyName,
                    2
                )}
                color="#3B82F6"
                isBold={true}
            />
        </ChartTooltipContainer>
    );
};

export default SecurityTransactionsPriceTooltip;
