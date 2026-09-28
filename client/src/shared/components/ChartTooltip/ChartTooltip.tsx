import React, { PropsWithChildren, ReactNode } from "react";
import { Box, BoxProps, Flex, Text } from "@chakra-ui/react";
import { CHART_THEME_COLORS } from "@/shared/constants/chartColors";

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

interface ItemProps {
    label: string;
    value: ReactNode;
    color?: string;
    valueColor?: string;
    isBold?: boolean;
}

export const ChartTooltipItem: React.FC<ItemProps> = ({
    label,
    value,
    color,
    valueColor = "text_primary",
    isBold = false,
}) => {
    return (
        <Flex alignItems="center" justifyContent="space-between" gap={3} fontSize="xs">
            <Flex alignItems="center" gap={2} minW={0}>
                {color && (
                    <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg={color}
                        boxShadow={`0 0 6px ${color}80`}
                        flexShrink={0}
                    />
                )}
                <Text color="text_primary" truncate maxW="150px" title={label}>
                    {label}
                </Text>
            </Flex>
            <Text fontWeight={isBold ? "bold" : "semibold"} color={valueColor} whiteSpace="nowrap">
                {value}
            </Text>
        </Flex>
    );
};
