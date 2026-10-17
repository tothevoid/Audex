import React from "react";
import { useTranslation } from "react-i18next";
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
}

export const SecurityTransactionsVolumeTooltip: React.FC<Props> = ({
    active,
    payload,
}) => {
    const { t, i18n } = useTranslation();

    if (!active || !payload || !payload.length) {
        return null;
    }

    const currentPoint = payload[0].payload;
    const formattedDate = formatDate(new Date(currentPoint.date), i18n);

    return (
        <ChartTooltipContainer minW="180px">
            <ChartTooltipHeader title={formattedDate} />
            <ChartTooltipItem
                label={t("securities_transactions_volume")}
                value={Number(currentPoint.volume).toLocaleString()}
                color="#10B981"
                isBold={true}
            />
        </ChartTooltipContainer>
    );
};

export default SecurityTransactionsVolumeTooltip;
