import React from 'react';
import { Box, Flex, FlexProps, Text } from '@chakra-ui/react';
import AddButton from '../AddButton/AddButton';

export interface SectionHeaderProps extends Omit<FlexProps, 'title'> {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl';
    onAdd?: () => void;
    addButtonTitle?: string;
    isAddDisabled?: boolean;
    leftElement?: React.ReactNode;
    extra?: React.ReactNode;
    rightElement?: React.ReactNode;
    children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    size = 'xl',
    onAdd,
    addButtonTitle,
    isAddDisabled,
    leftElement,
    extra,
    rightElement,
    children,
    justifyContent = 'space-between',
    alignItems = 'center',
    flexWrap = 'wrap',
    gap = 3,
    mb = 4,
    ...rest
}) => {
    const fontSize = size;
    const fontWeight = size === '2xl' || size === 'xl' ? 800 : 700;

    return (
        <Flex
            justifyContent={justifyContent}
            alignItems={alignItems}
            flexWrap={flexWrap}
            gap={gap}
            mb={mb}
            {...rest}
        >
            <Box>
                <Flex alignItems="center" gap={2.5} flexWrap="wrap">
                    {leftElement}
                    {typeof title === 'string' ? (
                        <Text fontSize={fontSize} fontWeight={fontWeight} color="text_primary">
                            {title}
                        </Text>
                    ) : (
                        title
                    )}
                    {onAdd && (
                        <AddButton
                            isCompact
                            size="xs"
                            buttonTitle={addButtonTitle}
                            onClick={onAdd}
                            disabled={isAddDisabled}
                        />
                    )}
                    {extra}
                </Flex>
                {subtitle && (
                    <Text fontSize="xs" color="text_secondary" mt={0.5}>
                        {subtitle}
                    </Text>
                )}
            </Box>

            {(rightElement || children) && (
                <Flex alignItems="center" gap={2} flexWrap="wrap">
                    {rightElement}
                    {children}
                </Flex>
            )}
        </Flex>
    );
};

export default SectionHeader;
