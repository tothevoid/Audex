import React, { useState } from 'react';
import { Box, Flex, Icon, Popover, Text, VStack } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import { NavLink } from 'react-router-dom';
import HeaderItem from '../HeaderItem/HeaderItem';

export interface HeaderNavDropdownItem {
    path: string;
    title: string;
    description?: string;
    icon?: React.ElementType;
}

interface HeaderNavDropdownProps {
    title: string;
    active: boolean;
    items: HeaderNavDropdownItem[];
}

export const HeaderNavDropdown: React.FC<HeaderNavDropdownProps> = ({ title, active, items }) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)} positioning={{ placement: 'bottom-start', gutter: 4 }}>
            <Popover.Trigger asChild>
                <Box cursor="pointer" height="100%">
                    <HeaderItem title={title} active={active} hasDropdown isOpen={open} />
                </Box>
            </Popover.Trigger>

            <Popover.Positioner>
                <Popover.Content
                    backgroundColor="background_secondary"
                    borderColor="border_primary"
                    boxShadow="0 16px 36px -4px rgba(0, 0, 0, 0.7)"
                    borderRadius="2xl"
                    p={2}
                    minW="270px"
                    outline="none"
                >
                    <Box px={3} pt={2} pb={1.5}>
                        <Text fontSize="0.68rem" fontWeight="700" color="text_secondary" letterSpacing="0.08em" textTransform="uppercase">
                            {title}
                        </Text>
                    </Box>

                    <VStack align="stretch" gap={1}>
                        {items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setOpen(false)}
                                style={{ textDecoration: 'none' }}
                            >
                                {({ isActive }) => (
                                    <Flex
                                        align="center"
                                        justify="space-between"
                                        px={3.5}
                                        py={2.5}
                                        borderRadius="0 8px 8px 0"
                                        backgroundColor={isActive ? 'background_primary' : 'transparent'}
                                        borderLeft="4px solid"
                                        borderLeftColor={isActive ? 'action_primary' : 'transparent'}
                                        transition="all 0.15s ease"
                                        _hover={{
                                            backgroundColor: 'background_primary',
                                            borderLeftColor: 'action_primary'
                                        }}
                                    >
                                        <Flex align="center" gap={3}>
                                            {item.icon && (
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    w="32px"
                                                    h="32px"
                                                    color={isActive ? 'action_primary' : 'text_secondary'}
                                                    transition="all 0.2s ease"
                                                >
                                                    <Icon as={item.icon} boxSize="19px" />
                                                </Flex>
                                            )}
                                            <VStack align="flex-start" gap={0}>
                                                <Text
                                                    fontSize="0.9rem"
                                                    fontWeight={isActive ? '700' : '600'}
                                                    color={isActive ? 'action_primary' : 'text_primary'}
                                                >
                                                    {item.title}
                                                </Text>
                                                {item.description && (
                                                    <Text fontSize="0.75rem" color="text_secondary" lineHeight="1.2">
                                                        {item.description}
                                                    </Text>
                                                )}
                                            </VStack>
                                        </Flex>

                                        <Icon
                                            as={LuChevronRight}
                                            boxSize="14px"
                                            color={isActive ? 'action_primary' : 'text_secondary'}
                                            opacity={isActive ? 1 : 0.3}
                                        />
                                    </Flex>
                                )}
                            </NavLink>
                        ))}
                    </VStack>
                </Popover.Content>
            </Popover.Positioner>
        </Popover.Root>
    );
};
