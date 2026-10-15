import React from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/shared/utilities/formatters/dateFormatter";
import { BrokerAccountPortfolioTimelinePointEntity } from "@/models/brokers/BrokerAccountPortfolioTimelinePointEntity";
import {
    ChartTooltipContainer,
    ChartTooltipHeader,
    ChartTooltipItem,
} from "@/shared/components/ChartTooltip";

interface PayloadItem {
    payload: BrokerAccountPortfolioTimelinePointEntity;
    value: number;
    dataKey: string;
}

interface Props {
    active?: boolean;
    payload?: PayloadItem[];
    currencyName: string;
}

export const BrokerAccountPnLTooltip: React.FC<Props> = ({
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
        <ChartTooltipContainer minW="190px">
            <ChartTooltipHeader title={formattedDate} />
            <ChartTooltipItem
                variant="pnl"
                label={t("broker_account_portfolio_chart_pnl_series")}
                amount={currentPoint.profitAndLoss}
                currencyName={currencyName}
                digits={0}
                showTrend
            />
        </ChartTooltipContainer>
    );
};
