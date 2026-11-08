import React from 'react';
import { Flex } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import HeaderItem from '@/features/Navigation/HeaderItem/HeaderItem';
import { HeaderNavDropdown } from './HeaderNavDropdown';
import { NavItem } from './navigationConfig';

export interface HeaderDesktopNavProps {
    navItems: NavItem[];
}

export const HeaderDesktopNav: React.FC<HeaderDesktopNavProps> = ({ navItems }) => {
    return (
        <Flex
            align="center"
            gap={{ base: 0.5, xl: 1 }}
            display={{ base: 'none', lg: 'flex' }}
            wrap="nowrap"
            minW={0}
        >
            {navItems.map((navigationElement) => {
                if (navigationElement.type === 'dropdown') {
                    return (
                        <HeaderNavDropdown
                            key={navigationElement.title}
                            title={navigationElement.title}
                            items={navigationElement.items}
                            activePrefixes={navigationElement.activePrefixes}
                        />
                    );
                }

                return (
                    <NavLink
                        key={navigationElement.path}
                        to={navigationElement.path}
                        end={navigationElement.exact}
                    >
                        {({ isActive }) => <HeaderItem title={navigationElement.title} active={isActive} />}
                    </NavLink>
                );
            })}
        </Flex>
    );
};

export default HeaderDesktopNav;
