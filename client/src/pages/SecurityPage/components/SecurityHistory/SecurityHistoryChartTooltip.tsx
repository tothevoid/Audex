import React from "react";
import { Box, HStack, Icon, Text } from "@chakra-ui/react";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { i18n as I18nInstance } from "i18next";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { formatChartTooltipDate, ChartPeriod } from "@/shared/utilities/formatters/dateFormatter";

interface Props {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
    currencyName: string;
    startPrice: number;
    period: ChartPeriod;
    i18n: I18nInstance;
}

const SecurityHistoryChartTooltip: React.FC<Props> = ({
    active,
    payload,
    label,
    currencyName,
    startPrice,
    period,
    i18n,
}) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const price = payload[0].value;
    const diff = price - startPrice;
    const diffPercent = startPrice > 0 ? (diff / startPrice) * 100 : 0;
    const isPositive = diff >= 0;

    const fullDateLabel = label ? formatChartTooltipDate(new Date(label), period, i18n) : "";

    return (
        <Box
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderWidth="1px"
            p={3}
            borderRadius="lg"
            boxShadow="xl"
            color="text_primary"
            minW="150px"
        >
            <Text fontSize="xs" color="text_secondary" mb={1}>
                {fullDateLabel}
            </Text>
            <Text fontSize="md" fontWeight={800} color="text_primary">
                {formatMoneyByCurrencyCulture(price, currencyName)}
            </Text>
            {startPrice > 0 && (
                <HStack gap={1} mt={1} fontSize="xs" color={isPositive ? "pnl_positive" : "pnl_negative"} fontWeight={700}>
                    <Icon>{isPositive ? <BsArrowUpRight size={12} /> : <BsArrowDownRight size={12} />}</Icon>
                    <Text>
                        {isPositive ? "+" : ""}
                        {formatMoneyByCurrencyCulture(diff, currencyName)} ({isPositive ? "+" : ""}
                        {diffPercent.toFixed(2)}%)
                    </Text>
                </HStack>
            )}
        </Box>
    );
};

export default SecurityHistoryChartTooltip;
