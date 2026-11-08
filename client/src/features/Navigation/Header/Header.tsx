import { Box, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { HeaderNotificationBell } from './HeaderNotificationBell';
import { HeaderActionsButton } from './HeaderActionsButton';
import { HeaderProfileMenu } from './HeaderProfileMenu';
import { HeaderMobileNav } from './HeaderMobileNav';
import { HeaderLogo } from './HeaderLogo';
import { HeaderDesktopNav } from './HeaderDesktopNav';
import { getNavigationItems } from './navigationConfig';

const Header = () => {
    const { t } = useTranslation();
    const navItems = getNavigationItems(t);

    return (
        <nav>
            <Box w="100%">
                <Flex
                    minH={50}
                    alignItems="center"
                    px={{ base: 2, lg: 3 }}
                    py={1}
                    direction="row"
                    justify="space-between"
                    backgroundColor="header_bg"
                    color="text_primary"
                    borderTop={import.meta.env.DEV ? '3px solid #f59e0b' : undefined}
                >
                    <Flex align="center" gap={{ base: 1, lg: 1.5 }} minW={0} flex="1">
                        <HeaderMobileNav navItems={navItems} />
                        <HeaderLogo />
                        <HeaderDesktopNav navItems={navItems} />
                    </Flex>

                    <Flex width="auto" flexShrink={0} justify="flex-end" direction="row" gap={{ base: 1.5, lg: 2 }} align="center" pl={2}>
                        <HeaderNotificationBell />
                        <HeaderActionsButton />
                        <HeaderProfileMenu />
                    </Flex>
                </Flex>
            </Box>
        </nav>
    );
};

export default Header;
