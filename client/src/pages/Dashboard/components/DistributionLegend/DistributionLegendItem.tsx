import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { DistributionModel } from "@/models/dashboard/DashboardEntity";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";

interface DistributionLegendItemProps {
    distributionItem: DistributionModel;
    percentage: string;
    color: string;
    isHovered: boolean;
    isDimmed: boolean;
    mainCurrency: string;
    onHover: () => void;
    onLeave: () => void;
}

export const DistributionLegendItem: React.FC<DistributionLegendItemProps> = ({
    distributionItem,
    percentage,
    color,
    isHovered,
    isDimmed,
    mainCurrency,
    onHover,
    onLeave
}) => {
    const formattedAmount = formatMoneyByCurrencyCulture(
        distributionItem.convertedAmount,
        mainCurrency
    );
    const tooltipTitle = `${distributionItem.name}: ${formattedAmount} (${percentage}%)`;

    return (
        <Flex
            align="center"
            gap={1.5}
            bg="background_secondary"
            borderWidth="1px"
            borderColor={isHovered ? color : "transparent"}
            opacity={isDimmed ? 0.4 : 1}
            px={2}
            py={0.5}
            borderRadius="md"
            fontSize="xs"
            maxW="100%"
            cursor="pointer"
            transition="all 0.15s ease"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            title={tooltipTitle}
        >
            <Box
                w="6px"
                h="6px"
                borderRadius="full"
                bg={color}
                flexShrink={0}
            />
            <Text
                color="text_primary"
                fontWeight={500}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                maxW="130px"
            >
                {distributionItem.name}
            </Text>
            <Text color="text_secondary" fontSize="2xs" flexShrink={0}>
                {percentage}%
            </Text>
        </Flex>
    );
};
