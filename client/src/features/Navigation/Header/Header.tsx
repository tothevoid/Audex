import HeaderItem from '../HeaderItem/HeaderItem';
import { Badge, Box, Button, Flex, Icon, Link } from '@chakra-ui/react';
import { IoIosFlash } from 'react-icons/io';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import UserProfileSettingsModal from '../../UserProfileSettingsModal/UserProfileSettingsModal';
import ChangePasswordModal from '../../ChangePasswordModal/ChangePasswordModal';
import TokensModal from '../../TokensModal/TokensModal';
import ActionsModal from '../../ActionsModal/ActionsModal';
import { NavLink, useLocation } from 'react-router-dom';
import { BaseModalRef } from '../../../shared/utilities/modalUtilities';
import { HeaderNotificationBell } from './HeaderNotificationBell';
import { HeaderProfileMenu } from './HeaderProfileMenu';
import { HeaderNavDropdown, HeaderNavDropdownItem } from './HeaderNavDropdown';
import AppIcon from '../../../shared/components/AppIcon/AppIcon';

import { MdAccountBalance, MdAccountBalanceWallet, MdCurrencyBitcoin, MdSchedule, MdShowChart, MdStorage } from 'react-icons/md';

type SingleNavItem = {
    type?: 'link';
    path: string;
    title: string;
    exact?: boolean;
};

type DropdownNavItem = {
    type: 'dropdown';
    title: string;
    items: HeaderNavDropdownItem[];
    activePrefixes: string[];
};

type NavItem = SingleNavItem | DropdownNavItem;

const Header = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const userProfileSettingsRef = useRef<BaseModalRef>(null);
    const changePasswordModalRef = useRef<BaseModalRef>(null);
    const tokensModalRef = useRef<BaseModalRef>(null);
    const actionsModalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        if (import.meta.env.DEV && !document.title.startsWith('[DEV]')) {
            document.title = `[DEV] ${document.title}`;
        }
    }, []);

    const onOpenSettingsClick = () => {
        userProfileSettingsRef.current?.openModal();
    };

    const onOpenChangePasswordClick = () => {
        changePasswordModalRef.current?.openModal();
    };

    const onOpenTokensClick = () => {
        tokensModalRef.current?.openModal();
    };

    const onOpenActionsClick = () => {
        actionsModalRef.current?.openModal();
    };

    const investmentNavItem: DropdownNavItem = {
        type: 'dropdown',
        title: t("header_investments"),
        activePrefixes: ['/broker_accounts', '/securities', '/broker_account/', '/security/'],
        items: [
            {
                path: "/broker_accounts",
                title: t("header_broker_accounts_short"),
                description: t("header_broker_accounts_desc"),
                icon: MdAccountBalance
            },
            {
                path: "/securities",
                title: t("header_securities"),
                description: t("header_securities_desc"),
                icon: MdShowChart
            }
        ]
    };

    const cryptoNavItem: DropdownNavItem = {
        type: 'dropdown',
        title: t("header_crypto"),
        activePrefixes: ['/crypto_accounts', '/cryptocurrencies', '/crypto_account/'],
        items: [
            {
                path: "/crypto_accounts",
                title: t("header_crypto_accounts_short"),
                description: t("header_crypto_accounts_desc"),
                icon: MdAccountBalanceWallet
            },
            {
                path: "/cryptocurrencies",
                title: t("header_cryptocurrencies"),
                description: t("header_cryptocurrencies_desc"),
                icon: MdCurrencyBitcoin
            }
        ]
    };

    const configurationNavItem: DropdownNavItem = {
        type: 'dropdown',
        title: t("header_configuration"),
        activePrefixes: ['/scheduler', '/data'],
        items: [
            {
                path: "/scheduler",
                title: t("header_scheduler"),
                description: t("header_scheduler_desc"),
                icon: MdSchedule
            },
            {
                path: "/data",
                title: t("header_data"),
                description: t("header_data_desc"),
                icon: MdStorage
            }
        ]
    };

    const navItems: NavItem[] = [
        { type: 'link', path: "/accounts", title: t("header_accounts") },
        { type: 'link', path: "/transactions", title: t("header_transactions") },
        { type: 'link', path: "/deposits", title: t("header_deposits") },
        { type: 'link', path: "/debts", title: t("header_debts") },
        investmentNavItem,
        cryptoNavItem,
        configurationNavItem
    ];

    return <nav>
        <Box w="100%">
            <Flex
                minH={50}
                alignItems="center"
                padding={1}
                direction={'row'}
                backgroundColor="header_bg"
                color="text_primary"
                borderTop={import.meta.env.DEV ? "3px solid #f59e0b" : undefined}
            >
                <Flex flex={{ base: 1 }} justify="center" align={"center"}>
                    <Flex align="center" mr={2}>
                        <Link asChild>
                            <NavLink to='/'><AppIcon marginInline="10px" size="30px" color="text_primary" /></NavLink>
                        </Link>
                        {import.meta.env.DEV && (
                            <Badge
                                colorPalette="amber"
                                variant="solid"
                                fontSize="0.65rem"
                                fontWeight="bold"
                                px={2}
                                py={0.5}
                                borderRadius="md"
                                letterSpacing="0.05em"
                                boxShadow="0 0 8px rgba(245, 158, 11, 0.4)"
                            >
                                DEV
                            </Badge>
                        )}
                    </Flex>
                    <Flex flex="1" align="center" gap={1}>
                        {
                            navItems.map((item, index) => {
                                if (item.type !== 'dropdown') {
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.exact}
                                            className={({ isActive }) => isActive ? 'active' : ''}
                                        >
                                            {({ isActive }) => <HeaderItem title={item.title} active={isActive} />}
                                        </NavLink>
                                    );
                                }

                                const isDropdownActive = item.activePrefixes.some(prefix =>
                                    location.pathname.startsWith(prefix)
                                );
                                return (
                                    <HeaderNavDropdown
                                        key={item.title + index}
                                        title={item.title}
                                        active={isDropdownActive}
                                        items={item.items}
                                    />
                                );
                            })
                        }
                    </Flex>
                </Flex>
                <Flex width="auto" justify="flex-end" direction="row" gap={2}>
                    <HeaderNotificationBell />
                    <Button
                        borderColor="border_primary"
                        background="button_background_secondary"
                        color="text_primary"
                        size={'md'}
                        onClick={onOpenActionsClick}
                        title={t("header_actions_title")}
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{
                            borderColor: "action_primary",
                            backgroundColor: "background_primary"
                        }}
                    >
                        <Icon color="card_action_icon_primary">
                            <IoIosFlash fontSize="1.1rem" />
                        </Icon>
                    </Button>
                    <HeaderProfileMenu
                        onOpenSettings={onOpenSettingsClick}
                        onOpenChangePassword={onOpenChangePasswordClick}
                        onOpenTokens={onOpenTokensClick}
                    />
                </Flex>
                <UserProfileSettingsModal ref={userProfileSettingsRef} />
                <ChangePasswordModal ref={changePasswordModalRef} />
                <TokensModal ref={tokensModalRef} />
                <ActionsModal ref={actionsModalRef} />
            </Flex>
        </Box>
    </nav>;
};

export default Header;
