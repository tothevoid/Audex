import React, { ReactNode } from "react";
import { SimpleGrid, SimpleGridProps, Skeleton } from "@chakra-ui/react";

export interface LoadingGridProps extends Omit<SimpleGridProps, "children"> {
    isLoading: boolean;
    count?: number;
    height?: string | number;
    borderRadius?: string;
    wrapChildren?: boolean;
    children: ReactNode;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({
    isLoading,
    count = 6,
    height = "100px",
    borderRadius = "md",
    columns = { base: 1, md: 2 },
    gap = 4,
    wrapChildren = false,
    children,
    ...gridProps
}) => {
    if (isLoading) {
        return (
            <SimpleGrid columns={columns} gap={gap} {...gridProps}>
                {Array.from({ length: count }, (_, index) => (
                    <Skeleton key={index} height={height} borderRadius={borderRadius} />
                ))}
            </SimpleGrid>
        );
    }

    if (wrapChildren) {
        return (
            <SimpleGrid columns={columns} gap={gap} {...gridProps}>
                {children}
            </SimpleGrid>
        );
    }

    return <>{children}</>;
};

export default LoadingGrid;
