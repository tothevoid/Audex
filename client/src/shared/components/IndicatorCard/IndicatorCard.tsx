import React from "react";
import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiMinus, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import EntityCard from "@/shared/components/EntityCard/EntityCard";

export interface IndicatorCardProps {
    title: string;
    amount: number;
    percent?: number;
    currencySymbol?: string;
    icon?: React.ReactNode;
    showSign?: boolean;
    isHoverable?: boolean;
    onClick?: () => void;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({
    title,
    amount,
    percent,
    currencySymbol,
    icon,
    showSign = true,
    isHoverable,
    onClick
}) => {
    const { i18n } = useTranslation();

    const isZero = Math.abs(amount) < 0.005;
    const isPositive = !isZero && amount > 0;
    const isNegative = !isZero && amount < 0;

    const sign = showSign && isPositive ? "+" : "";
    const formattedAmount = `${sign}${amount.toLocaleString(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const valueColor = isPositive ? "gain" : isNegative ? "loss" : "text_primary";

    const hasPercent = percent !== undefined;
    const percentIsZero = hasPercent && Math.abs(percent) < 0.005;
    const percentIsPositive = hasPercent && !percentIsZero && percent > 0;
    const percentIsNegative = hasPercent && !percentIsZero && percent < 0;

    const percentSign = percentIsPositive ? "+" : "";
    const formattedPercent = hasPercent
        ? `${percentSign}${percent.toLocaleString(i18n.language, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
          })}%`
        : null;

    const badgeStyles = percentIsPositive
        ? {
              color: "pnl_positive",
              backgroundColor: "pnl_positive_bg",
              borderColor: "pnl_positive_border"
          }
        : percentIsNegative
        ? {
              color: "pnl_negative",
              backgroundColor: "pnl_negative_bg",
              borderColor: "pnl_negative_border"
          }
        : {
              color: "text_secondary",
              backgroundColor: "background_primary",
              borderColor: "border_primary"
          };

    const TrendIcon = percentIsPositive ? FiTrendingUp : percentIsNegative ? FiTrendingDown : FiMinus;

    return (
        <EntityCard
            backgroundColor="background_secondary"
            borderRadius="lg"
            px={3}
            py={2.5}
            h="full"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            cursor={onClick ? "pointer" : "default"}
            isHoverable={isHoverable ?? Boolean(onClick)}
            onClick={onClick}
        >
            {/* Header: Title with optional icon & Percentage Badge */}
            <Flex justify="space-between" align="center" mb={1}>
                <HStack gap={1.5}>
                    {icon && (
                        <Box color="action_primary" fontSize="xs">
                            {icon}
                        </Box>
                    )}
                    <Text
                        fontSize="2xs"
                        fontWeight="bold"
                        letterSpacing="wider"
                        textTransform="uppercase"
                        color="text_secondary"
                    >
                        {title}
                    </Text>
                </HStack>

                {hasPercent && (
                    <Badge
                        display="inline-flex"
                        alignItems="center"
                        gap={0.5}
                        px={1.5}
                        py={0.25}
                        borderRadius="md"
                        fontSize="2xs"
                        fontWeight="extrabold"
                        color={badgeStyles.color}
                        backgroundColor={badgeStyles.backgroundColor}
                        borderWidth="1px"
                        borderColor={badgeStyles.borderColor}
                    >
                        <TrendIcon size={11} />
                        <Text>{formattedPercent}</Text>
                    </Badge>
                )}
            </Flex>

            {/* Main Value Row */}
            <HStack gap={1} align="baseline" my="auto" wrap="nowrap">
                <Text
                    fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
                    fontWeight="extrabold"
                    color={valueColor}
                    letterSpacing="tight"
                    lineHeight="1.1"
                    whiteSpace="nowrap"
                >
                    {formattedAmount}
                </Text>
                {currencySymbol && (
                    <Text fontSize="xs" fontWeight="bold" color="text_secondary">
                        {currencySymbol}
                    </Text>
                )}
            </HStack>
        </EntityCard>
    );
};

export default IndicatorCard;
