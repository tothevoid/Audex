import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CloseButton,
    Drawer,
    IconButton,
    Portal,
    VStack
} from '@chakra-ui/react';
import { LuMenu } from 'react-icons/lu';
import { HeaderLogo } from './HeaderLogo';
import { HeaderMobileNavItem } from './HeaderMobileNavItem';
import { HeaderMobileNavCategory } from './HeaderMobileNavCategory';
import {
    getNavigationItems,
    NavItem
} from './navigationConfig';

export interface HeaderMobileNavProps {
    navItems?: NavItem[];
}

export const HeaderMobileNav: React.FC<HeaderMobileNavProps> = ({ navItems }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const items = navItems ?? getNavigationItems(t);
    const handleClose = () => setOpen(false);

    return (
        <Drawer.Root
            open={open}
            onOpenChange={(eventDetails) => setOpen(eventDetails.open)}
            placement="start"
            size="xs"
        >
            <Drawer.Trigger asChild>
                <IconButton
                    aria-label="Open Navigation"
                    variant="ghost"
                    color="text_primary"
                    size="sm"
                    display={{ base: 'inline-flex', lg: 'none' }}
                >
                    <LuMenu />
                </IconButton>
            </Drawer.Trigger>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content
                        backgroundColor="background_secondary"
                        borderColor="border_primary"
                        color="text_primary"
                        maxW="310px"
                        display="flex"
                        flexDirection="column"
                    >
                        <Drawer.Header
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            pb={3}
                            pt={4}
                            px={4}
                            borderBottomWidth="1px"
                            borderColor="border_primary"
                        >
                            <HeaderLogo showTitle onClick={handleClose} />
                            <Drawer.CloseTrigger asChild>
                                <CloseButton size="sm" color="text_primary" />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>

                        <Drawer.Body px={3} py={3} overflowY="auto" flex={1}>
                            <VStack align="stretch" gap={3}>
                                {items.map((item) =>
                                    item.type === 'link' ? (
                                        <HeaderMobileNavItem
                                            key={item.path}
                                            path={item.path}
                                            title={item.title}
                                            icon={item.icon}
                                            onClick={handleClose}
                                        />
                                    ) : (
                                        <HeaderMobileNavCategory
                                            key={item.title}
                                            title={item.title}
                                            items={item.items}
                                            onItemClick={handleClose}
                                        />
                                    )
                                )}
                            </VStack>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};

export default HeaderMobileNav;
