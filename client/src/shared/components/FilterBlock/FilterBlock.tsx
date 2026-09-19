import React from 'react';
import { Box, BoxProps, Flex } from '@chakra-ui/react';
import SwitchButton, { SwitchButtonProps } from '../SwitchButton/SwitchButton';

export interface FilterBlockProps extends BoxProps {
    children?: React.ReactNode;
    /** Convenience shortcut for a single active toggle switch */
    active?: boolean;
    activeTitle?: string;
    onActiveChange?: (active: boolean) => void;
}

export const FilterBlockDivider: React.FC = () => (
    <Box h="20px" w="1px" bg="border_primary" display={{ base: "none", sm: "block" }} />
);

export const FilterBlock: React.FC<FilterBlockProps> & {
    Switch: React.FC<SwitchButtonProps>;
    Divider: React.FC;
} = ({
    children,
    active,
    activeTitle,
    onActiveChange,
    backgroundColor = "background_primary",
    borderColor = "border_primary",
    borderWidth = "1px",
    borderRadius = "xl",
    p = 3,
    boxShadow = "xs",
    mb = 4,
    ...rest
}) => {
    return (
        <Box
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            borderWidth={borderWidth}
            borderRadius={borderRadius}
            p={p}
            boxShadow={boxShadow}
            mb={mb}
            {...rest}
        >
            <Flex alignItems="center" gap={4} flexWrap="wrap">
                {activeTitle && onActiveChange && (
                    <SwitchButton
                        active={Boolean(active)}
                        title={activeTitle}
                        onSwitch={onActiveChange}
                    />
                )}
                {children}
            </Flex>
        </Box>
    );
};

FilterBlock.Switch = SwitchButton;
FilterBlock.Divider = FilterBlockDivider;

export default FilterBlock;
