import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { HeaderNavDropdownItem } from './navigationConfig';

export interface HeaderMobileNavCategoryProps {
    title: string;
    items: HeaderNavDropdownItem[];
    onItemClick: () => void;
}

export const HeaderMobileNavCategory: React.FC<HeaderMobileNavCategoryProps> = ({
    title,
    items,
    onItemClick
}) => {
    const location = useLocation();

    return (
        <Box pt={1}>
            <Box px={3.5} pb={1.5}>
                <Text
                    fontSize="0.68rem"
                    fontWeight="700"
                    color="text_secondary"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                >
                    {title}
                </Text>
            </Box>
            <VStack align="stretch" gap={1}>
                {items.map((subItem) => {
                    const isCurrentSubActive = location.pathname.startsWith(subItem.path);

                    return (
                        <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={onItemClick}
                            style={{ textDecoration: 'none' }}
                        >
                            <Flex
                                align="center"
                                gap={3}
                                px={3.5}
                                py={2}
                                borderRadius="md"
                                backgroundColor={isCurrentSubActive ? 'background_primary' : 'transparent'}
                                borderLeft="4px solid"
                                borderLeftColor={isCurrentSubActive ? 'action_primary' : 'transparent'}
                                minH="44px"
                                transition="all 0.15s ease"
                                _hover={{
                                    backgroundColor: 'background_primary',
                                    borderLeftColor: 'action_primary'
                                }}
                            >
                                {subItem.icon && (
                                    <Flex
                                        align="center"
                                        justify="center"
                                        w="28px"
                                        h="28px"
                                        color={isCurrentSubActive ? 'action_primary' : 'text_secondary'}
                                    >
                                        <Icon as={subItem.icon} boxSize="18px" />
                                    </Flex>
                                )}
                                <VStack align="flex-start" gap={0}>
                                    <Text
                                        fontSize="0.9rem"
                                        fontWeight={isCurrentSubActive ? '700' : '600'}
                                        color={isCurrentSubActive ? 'action_primary' : 'text_primary'}
                                    >
                                        {subItem.title}
                                    </Text>
                                    {subItem.description && (
                                        <Text fontSize="0.72rem" color="text_secondary" lineHeight="1.2">
                                            {subItem.description}
                                        </Text>
                                    )}
                                </VStack>
                            </Flex>
                        </NavLink>
                    );
                })}
            </VStack>
        </Box>
    );
};

export default HeaderMobileNavCategory;

