import React, { ReactNode } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import Placeholder from "./Placeholder";

export interface PlaceholderWrapperProps {
    /** Condition determining whether children or placeholder should be rendered. */
    hasData?: boolean;
    condition?: boolean;
    text: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    placeholderBoxProps?: BoxProps;
    customPlaceholder?: ReactNode;
    children: ReactNode;
}

export const PlaceholderWrapper: React.FC<PlaceholderWrapperProps> = ({
    hasData,
    condition,
    text,
    description,
    icon,
    action,
    placeholderBoxProps = { mb: 4 },
    customPlaceholder,
    children,
}) => {
    const isVisible = condition ?? hasData ?? false;

    if (isVisible) {
        return <>{children}</>;
    }

    if (customPlaceholder) {
        return <Box {...placeholderBoxProps}>{customPlaceholder}</Box>;
    }

    return (
        <Box {...placeholderBoxProps}>
            <Placeholder text={text} description={description} icon={icon}>
                {action}
            </Placeholder>
        </Box>
    );
};

export default PlaceholderWrapper;
