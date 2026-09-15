import React from "react";
import { Box, BoxProps } from "@chakra-ui/react";

export interface PageContainerProps extends BoxProps {
    children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, ...rest }) => {
    return (
        <Box pb={8} {...rest}>
            {children}
        </Box>
    );
};

export default PageContainer;
