import React, { ReactNode } from "react";
import { Flex, SimpleGrid, SimpleGridProps } from "@chakra-ui/react";

export interface MetricsGridProps {
    children: ReactNode;
    hasTopDivider?: boolean;
    layout?: "grid" | "flex";
    columns?: SimpleGridProps["columns"];
    gap?: SimpleGridProps["gap"];
    pt?: SimpleGridProps["pt"];
    mt?: SimpleGridProps["mt"];
    className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
    children,
    hasTopDivider = true,
    layout = "grid",
    columns = { base: 2, sm: 2, md: 4 },
    gap,
    pt,
    mt,
    className
}) => {
    const defaultTopPadding = hasTopDivider ? 3 : 0;
    const defaultTopMargin = hasTopDivider ? 3 : 0;

    if (layout === "flex") {
        return (
            <Flex
                borderTopWidth={hasTopDivider ? "1px" : undefined}
                borderColor={hasTopDivider ? "border_primary" : undefined}
                pt={pt ?? defaultTopPadding}
                mt={mt ?? defaultTopMargin}
                justifyContent="flex-start"
                alignItems="center"
                flexWrap="wrap"
                gap={gap ?? { base: 4, md: 6 }}
                className={className}
            >
                {children}
            </Flex>
        );
    }

    return (
        <SimpleGrid
            columns={columns}
            gap={gap ?? { base: 3, md: 4 }}
            alignItems="center"
            borderTopWidth={hasTopDivider ? "1px" : undefined}
            borderColor={hasTopDivider ? "border_primary" : undefined}
            pt={pt ?? defaultTopPadding}
            mt={mt ?? defaultTopMargin}
            className={className}
        >
            {children}
        </SimpleGrid>
    );
};

export default MetricsGrid;
