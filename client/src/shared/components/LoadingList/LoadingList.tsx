import React, { ReactNode } from "react";
import { Skeleton, Stack, StackProps } from "@chakra-ui/react";

interface Props extends Omit<StackProps, "children"> {
    isLoading: boolean;
    count?: number;
    height?: string | number;
    borderRadius?: string;
    children: ReactNode;
}

const LoadingList: React.FC<Props> = ({
    isLoading,
    count = 3,
    height = "72px",
    borderRadius = "xl",
    gap = 4,
    my = 4,
    children,
    ...stackProps
}) => {
    if (isLoading) {
        return (
            <Stack gap={gap} my={my} {...stackProps}>
                {Array.from({ length: count }, (_, index) => (
                    <Skeleton key={index} height={height} borderRadius={borderRadius} />
                ))}
            </Stack>
        );
    }

    return <>{children}</>;
};

export default LoadingList;
