import React, { ReactNode } from "react";
import { SimpleGrid, SimpleGridProps } from "@chakra-ui/react";

export interface CardsGridProps extends Omit<SimpleGridProps, "templateColumns" | "children"> {
    children: ReactNode;
    minCardWidth?: string | number;
}

export const CardsGrid: React.FC<CardsGridProps> = ({
    children,
    minCardWidth = "320px",
    gap = 4,
    pb = 5,
    ...restGridProps
}) => {
    const formattedMinWidth = typeof minCardWidth === "number" ? `${minCardWidth}px` : minCardWidth;

    return (
        <SimpleGrid
            pb={pb}
            gap={gap}
            templateColumns={`repeat(auto-fill, minmax(${formattedMinWidth}, 1fr))`}
            {...restGridProps}
        >
            {children}
        </SimpleGrid>
    );
};

export default CardsGrid;

