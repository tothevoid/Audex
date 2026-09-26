import React from "react";
import { Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BsArrowDownLeft, BsArrowUpRight, BsPiggyBank } from "react-icons/bs";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";

interface Props {
    depositedByPeriod: number;
    withdrawnByPeriod: number;
    currencyName: string;
}

const TransfersHistoryPeriodStats: React.FC<Props> = ({
    depositedByPeriod,
    withdrawnByPeriod,
    currencyName
}) => {
    const { t } = useTranslation();
    const netPeriodFlow = depositedByPeriod - withdrawnByPeriod;

    return (
        <Flex
            mb={4}
            p={3}
            borderRadius="lg"
            backgroundColor="background_secondary"
            borderColor="border_primary"
            borderWidth="1px"
            justifyContent="flex-start"
            alignItems="center"
            flexWrap="wrap"
            gap={{ base: 4, md: 8 }}
        >
            <NumericMetricItem
                icon={<BsArrowDownLeft size={14} />}
                iconBg="status_success_bg"
                iconColor="status_success"
                label={t("transfers_history_chart_period_deposited")}
                value={depositedByPeriod}
                currency={currencyName}
                size="sm"
            />
            <NumericMetricItem
                icon={<BsArrowUpRight size={14} />}
                iconBg="status_danger_bg"
                iconColor="status_danger"
                label={t("transfers_history_chart_period_withdrawn")}
                value={withdrawnByPeriod}
                currency={currencyName}
                size="sm"
            />
            <NumericMetricItem
                icon={<BsPiggyBank size={14} />}
                iconBg={netPeriodFlow >= 0 ? "status_success_bg" : "status_danger_bg"}
                iconColor={netPeriodFlow >= 0 ? "status_success" : "status_danger"}
                label={t("transfers_history_chart_net_flow")}
                value={netPeriodFlow}
                currency={currencyName}
                isPnl
                size="sm"
            />
        </Flex>
    );
};

export default TransfersHistoryPeriodStats;
