import React from "react";
import { HStack, Text, StackProps } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";

export interface TrendDiffProps extends Omit<StackProps, "children"> {
    change: number;
    changePercent: number;
    decimals?: number;
    iconSize?: number;
    showIcon?: boolean;
}

export const TrendDiff: React.FC<TrendDiffProps> = ({
    change,
    changePercent,
    decimals,
    iconSize = 14,
    showIcon = true,
    justify = "center",
    mt = 1.5,
    ...stackProps
}) => {
    const { i18n } = useTranslation();
    const isZero = Math.abs(change) < 0.00001;
    const isPositive = !isZero && change > 0;
    const isNegative = !isZero && change < 0;

    const changeColor = isPositive ? "gain" : isNegative ? "loss" : "text_secondary";
    const TrendIcon = isPositive ? LuTrendingUp : isNegative ? LuTrendingDown : null;
    const sign = isPositive ? "+" : isNegative ? "−" : "";

    const changeDecimals = decimals ?? (Math.abs(change) > 0 && Math.abs(change) < 0.01 ? 4 : 2);
    const formattedChange = Math.abs(change).toLocaleString(i18n.language, {
        minimumFractionDigits: changeDecimals,
        maximumFractionDigits: changeDecimals
    });

    const formattedPercent = Math.abs(changePercent).toLocaleString(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <HStack
            gap={1}
            color={changeColor}
            fontSize="sm"
            fontWeight="semibold"
            mt={mt}
            justify={justify}
            {...stackProps}
        >
            {showIcon && TrendIcon && <TrendIcon size={iconSize} />}
            <Text fontSize="xs" fontWeight="semibold">
                {sign}{formattedChange} ({formattedPercent}%)
            </Text>
        </HStack>
    );
};

export default TrendDiff;
