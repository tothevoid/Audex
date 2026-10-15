import React, { PropsWithChildren, ReactNode } from "react";
import { Box, BoxProps, Flex, Icon, Text } from "@chakra-ui/react";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { CHART_THEME_COLORS } from "@/shared/constants/chartColors";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { Nullable } from "@/shared/utilities/nullable";

interface ContainerProps extends BoxProps {
    minW?: string | number;
    maxW?: string | number;
}

export const ChartTooltipContainer: React.FC<PropsWithChildren<ContainerProps>> = ({
    children,
    minW = "180px",
    maxW,
    ...rest
}) => {
    return (
        <Box
            bg={CHART_THEME_COLORS.tooltipBg}
            border="1px solid"
            borderColor={CHART_THEME_COLORS.tooltipBorder}
            borderRadius="lg"
            px={4}
            py={3}
            boxShadow="0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)"
            minW={minW}
            maxW={maxW}
            {...rest}
        >
            {children}
        </Box>
    );
};

interface HeaderProps {
    title: string;
    value?: ReactNode;
    valueColor?: string;
}

export const ChartTooltipHeader: React.FC<HeaderProps> = ({
    title,
    value,
    valueColor = CHART_THEME_COLORS.earnings,
}) => {
    return (
        <Flex justifyContent="space-between" alignItems="center" mb={2} gap={3}>
            <Text fontSize="xs" fontWeight="semibold" color="text_secondary" textTransform="capitalize">
                {title}
            </Text>
            {value !== undefined && (
                <Text fontSize="xs" fontWeight="bold" color={valueColor}>
                    {value}
                </Text>
            )}
        </Flex>
    );
};

export type ChartTooltipItemVariant = "default" | "pnl";

export interface ChartTooltipItemProps {
    label: string;
    variant?: ChartTooltipItemVariant;
    amount?: number;
    currencyName?: Nullable<string>;
    digits?: number;
    value?: ReactNode;
    color?: string;
    valueColor?: string;
    isBold?: boolean;
    showTrend?: boolean;
}

export const ChartTooltipItem: React.FC<ChartTooltipItemProps> = ({
    label,
    variant = "default",
    amount,
    currencyName,
    digits = 2,
    value,
    color,
    valueColor,
    isBold,
    showTrend = false,
}) => {
    let resolvedValue: ReactNode = value;
    let resolvedColor = color;
    let resolvedValueColor = valueColor ?? "text_primary";
    const resolvedIsBold = isBold ?? (variant === "pnl");

    if (variant === "pnl" && amount !== undefined) {
        const isNegative = amount < 0;
        const isPositive = amount > 0;

        resolvedColor ??= isNegative
            ? "var(--chakra-colors-loss)"
            : "var(--chakra-colors-gain)";

        resolvedValueColor = valueColor ?? (isPositive ? "gain" : isNegative ? "loss" : "text_primary");

        const sign = isPositive ? "+" : "";
        resolvedValue = currencyName
            ? `${sign}${formatMoneyByCurrencyCulture(amount, currencyName, digits)}`
            : `${sign}${amount}`;
    }

    const showTrendIcon = showTrend && variant === "pnl" && amount !== undefined;

    return (
        <Flex alignItems="center" justifyContent="space-between" gap={3} fontSize="xs">
            <Flex alignItems="center" gap={2} minW={0}>
                {resolvedColor && (
                    <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg={resolvedColor}
                        boxShadow={`0 0 6px ${resolvedColor}80`}
                        flexShrink={0}
                    />
                )}
                <Text color="text_primary" truncate maxW="150px" title={label}>
                    {label}
                </Text>
            </Flex>
            <Flex
                alignItems="center"
                gap={1}
                fontWeight={resolvedIsBold ? "bold" : "semibold"}
                color={resolvedValueColor}
                whiteSpace="nowrap"
            >
                {showTrendIcon && (
                    <Icon color={resolvedValueColor} display="inline-flex" alignItems="center">
                        {amount < 0 ? (
                            <BsArrowDownRight size={12} />
                        ) : (
                            <BsArrowUpRight size={12} />
                        )}
                    </Icon>
                )}
                <Text as="span">{resolvedValue}</Text>
            </Flex>
        </Flex>
    );
};
