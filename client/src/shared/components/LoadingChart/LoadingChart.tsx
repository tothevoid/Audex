import React, { ReactNode } from "react";
import { Skeleton, SkeletonProps } from "@chakra-ui/react";

export interface LoadingChartProps extends Omit<SkeletonProps, "children"> {
    isLoading: boolean;
    height?: string | number;
    borderRadius?: string;
    width?: string | number;
    children: ReactNode;
}

export const LoadingChart: React.FC<LoadingChartProps> = ({
    isLoading,
    height = "380px",
    borderRadius = "lg",
    width = "100%",
    children,
    ...skeletonProps
}) => {
    if (isLoading) {
        return (
            <Skeleton
                height={height}
                borderRadius={borderRadius}
                width={width}
                {...skeletonProps}
            />
        );
    }

    return <>{children}</>;
};

export default LoadingChart;
