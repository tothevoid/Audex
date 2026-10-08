import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { DistributionModel } from "@/models/dashboard/DashboardEntity";
import { CHARTS_COLORS } from "@/shared/constants/chartColors";
import { Nullable } from "@/shared/utilities/nullable";
import { DistributionLegendItem } from "./DistributionLegendItem";

interface DistributionLegendProps {
    items: DistributionModel[];
    totalAmount: number;
    mainCurrency: string;
    activeIndex: Nullable<number>;
    onItemHover: (index: number) => void;
    onItemLeave: () => void;
}

export const DistributionLegend: React.FC<DistributionLegendProps> = ({
    items,
    totalAmount,
    mainCurrency,
    activeIndex,
    onItemHover,
    onItemLeave
}) => {
    return (
        <Box
            w="100%"
            maxH="100px"
            overflowY="auto"
            pr={1}
            css={{
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                    background: "var(--chakra-colors-border_primary)",
                    borderRadius: "4px"
                }
            }}
        >
            <Flex wrap="wrap" gap={1.5} justify="center" align="center">
                {items.map((distributionItem, index) => {
                    const percentage = totalAmount > 0
                        ? ((distributionItem.convertedAmount / totalAmount) * 100).toFixed(1)
                        : "0.0";
                    const color = CHARTS_COLORS[index % CHARTS_COLORS.length];
                    const isHovered = activeIndex === index;
                    const isDimmed = activeIndex !== null && !isHovered;

                    return (
                        <DistributionLegendItem
                            key={`legend-${index}-${distributionItem.name}`}
                            distributionItem={distributionItem}
                            percentage={percentage}
                            color={color}
                            isHovered={isHovered}
                            isDimmed={isDimmed}
                            mainCurrency={mainCurrency}
                            onHover={() => onItemHover(index)}
                            onLeave={onItemLeave}
                        />
                    );
                })}
            </Flex>
        </Box>
    );
};
