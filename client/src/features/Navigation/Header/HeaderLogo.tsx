import React from 'react';
import { Badge, Flex, Link, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import AppIcon from '@/shared/components/AppIcon/AppIcon';

export interface HeaderLogoProps {
    showTitle?: boolean;
    onClick?: () => void;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({
    showTitle = false,
    onClick
}) => {
    const logoContent = (
        <Flex align="center" gap={{ base: 1.5, lg: 2 }} mr={{ base: 1, lg: 2 }} flexShrink={0} cursor="pointer">
            <AppIcon marginInline={showTitle ? undefined : { base: '2px', lg: '6px' }} size="28px" color="text_primary" />
            {showTitle && (
                <Text fontSize="lg" fontWeight="bold" letterSpacing="0.02em">
                    Audex
                </Text>
            )}
            {import.meta.env.DEV && (
                <Badge
                    colorPalette="amber"
                    variant="solid"
                    fontSize="0.6rem"
                    fontWeight="bold"
                    px={1.5}
                    py={0.2}
                    borderRadius="md"
                    letterSpacing="0.05em"
                    boxShadow="0 0 8px rgba(245, 158, 11, 0.4)"
                >
                    DEV
                </Badge>
            )}
        </Flex>
    );

    return (
        <Link asChild onClick={onClick}>
            <NavLink to="/">
                {logoContent}
            </NavLink>
        </Link>
    );
};

export default HeaderLogo;
