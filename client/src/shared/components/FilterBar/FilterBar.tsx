import React from 'react';
import { Box, BoxProps, Flex, FlexProps, Icon, Input } from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md';

export interface FilterBarSearchProps {
    searchText?: string;
    value?: string;
    onSearchTextChanged?: (text: string) => void;
    onChange?: (text: string) => void;
    placeholder?: string;
    maxW?: BoxProps['maxW'];
    flex?: BoxProps['flex'];
    size?: 'xs' | 'sm' | 'md';
}

export const FilterBarSearch: React.FC<FilterBarSearchProps> = ({
    searchText,
    value,
    onSearchTextChanged,
    onChange,
    placeholder,
    maxW = { base: 'full', md: '300px' },
    flex = 1,
    size = 'sm',
}) => {
    const currentValue = searchText ?? value ?? '';
    const handleTextChange = onSearchTextChanged ?? onChange;

    return (
        <Box flex={flex} maxW={maxW} position="relative">
            <Input
                value={currentValue}
                onChange={(e) => handleTextChange?.(e.target.value)}
                placeholder={placeholder}
                size={size}
                backgroundColor="background_primary"
                borderColor="border_primary"
                color="text_primary"
                ps={9}
            />
            <Icon
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                color="text_secondary"
                size={size}
            >
                <MdSearch size={18} />
            </Icon>
        </Box>
    );
};

export interface FilterBarProps extends FlexProps {
    children: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    children,
    direction = { base: 'column', md: 'row' },
    gap = 3,
    align = { base: 'stretch', md: 'center' },
    justify = 'space-between',
    mb = 4,
    p = 3,
    borderRadius = 'lg',
    backgroundColor = 'background_primary',
    borderColor = 'border_primary',
    borderWidth = '1px',
    ...rest
}) => {
    return (
        <Flex
            direction={direction}
            gap={gap}
            align={align}
            justify={justify}
            mb={mb}
            p={p}
            borderRadius={borderRadius}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            borderWidth={borderWidth}
            {...rest}
        >
            {children}
        </Flex>
    );
};

export default FilterBar;
