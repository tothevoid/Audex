import React, { ElementType } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Flex, Icon, Text } from '@chakra-ui/react';

export interface HeaderMobileNavItemProps {
    path: string;
    title: string;
    icon: ElementType;
    onClick: () => void;
}

export const HeaderMobileNavItem: React.FC<HeaderMobileNavItemProps> = ({
    path,
    title,
    icon,
    onClick
}) => {
    const location = useLocation();
    const isCurrentActive = location.pathname.startsWith(path);

    return (
        <NavLink
            to={path}
            onClick={onClick}
            style={{ textDecoration: 'none' }}
        >
            <Flex
                align="center"
                gap={3}
                px={3.5}
                py={2.5}
                borderRadius="md"
                backgroundColor={isCurrentActive ? 'background_primary' : 'transparent'}
                borderLeft="4px solid"
                borderLeftColor={isCurrentActive ? 'action_primary' : 'transparent'}
                color={isCurrentActive ? 'action_primary' : 'text_primary'}
                fontWeight={isCurrentActive ? '700' : '500'}
                minH="44px"
                transition="all 0.15s ease"
                _hover={{
                    backgroundColor: 'background_primary',
                    borderLeftColor: 'action_primary'
                }}
            >
                <Icon as={icon} boxSize="20px" />
                <Text fontSize="0.95rem">{title}</Text>
            </Flex>
        </NavLink>
    );
};

export default HeaderMobileNavItem;

