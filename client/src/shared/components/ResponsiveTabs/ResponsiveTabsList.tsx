import React, { ElementType } from 'react';
import { Box, NativeSelect, Tabs, useTabsContext } from '@chakra-ui/react';

export interface ResponsiveTabItem {
    value: string;
    label: string;
    icon?: ElementType;
    disabled?: boolean;
}

export interface ResponsiveTabsListProps {
    items: ResponsiveTabItem[];
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveTabsList: React.FC<ResponsiveTabsListProps> = ({
    items,
    breakpoint = 'lg'
}) => {
    const tabs = useTabsContext();

    return (
        <>
            {/* Mobile / Tablet select picker */}
            <Box
                display={{ base: 'block', [breakpoint]: 'none' }}
                mb={1}
                w="100%"
            >
                <NativeSelect.Root size="md" w="100%">
                    <NativeSelect.Field
                        value={tabs.value ?? ''}
                        onChange={(event) => tabs.setValue(event.currentTarget.value)}
                        backgroundColor="background_primary"
                        borderColor="border_primary"
                        color="text_primary"
                    >
                        {items.map((item) => (
                            <option
                                key={item.value}
                                value={item.value}
                                disabled={item.disabled}
                            >
                                {item.label}
                            </option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            </Box>

            {/* Desktop horizontal tabs */}
            <Tabs.List display={{ base: 'none', [breakpoint]: 'flex' }} flexWrap="nowrap">
                {items.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <Tabs.Trigger
                            key={item.value}
                            value={item.value}
                            disabled={item.disabled}
                            whiteSpace="nowrap"
                            flexShrink={0}
                            px={{ base: 2.5, xl: 3.5 }}
                            py={1.5}
                            fontSize={{ base: 'xs', xl: 'sm' }}
                        >
                            {IconComponent && (
                                <Box as="span" display="inline-flex" flexShrink={0} mr={1}>
                                    <IconComponent />
                                </Box>
                            )}
                            {item.label}
                        </Tabs.Trigger>
                    );
                })}
            </Tabs.List>
        </>
    );
};

export default ResponsiveTabsList;
