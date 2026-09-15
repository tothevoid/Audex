import HeaderItem from '../HeaderItem/HeaderItem';
import { Badge, Box, Button, Flex, Icon, Image, Link } from '@chakra-ui/react';
import { AiFillTool } from 'react-icons/ai';
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
import appIcon from './AppIcon.svg';

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

    const standaloneTabs = [
        { path: "/", title: t("header_dashboard") },
        { path: "/accounts", title: t("header_accounts") },
        { path: "/transactions", title: t("header_transactions") },
        { path: "/deposits", title: t("header_deposits") }
    ];

    const investmentItems: HeaderNavDropdownItem[] = [
        { path: "/broker_accounts", title: t("header_broker_accounts_short") },
        { path: "/securities", title: t("header_securities") }
    ];

    const cryptoItems: HeaderNavDropdownItem[] = [
        { path: "/crypto_accounts", title: t("header_crypto_accounts_short") },
        { path: "/cryptocurrencies", title: t("header_cryptocurrencies") }
    ];

    const trailingTabs = [
        { path: "/debts", title: t("header_debts") }
    ];

    const endingTabs = [
        { path: "/scheduler", title: t("header_scheduler") },
        { path: "/data", title: t("header_data") }
    ];

    const isInvestmentsActive =
        location.pathname.startsWith('/broker_accounts') ||
        location.pathname.startsWith('/securities') ||
        location.pathname.startsWith('/broker_account/') ||
        location.pathname.startsWith('/security/');

    const isCryptoActive =
        location.pathname.startsWith('/crypto_accounts') ||
        location.pathname.startsWith('/cryptocurrencies') ||
        location.pathname.startsWith('/crypto_account/');

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
                        <Link href='/'>
                            <Image marginInline={"10px"} width="30px" src={appIcon}></Image>
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
                            standaloneTabs.map(tab =>
                                <NavLink key={tab.path} to={tab.path} end={tab.path === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
                                    {({ isActive }) => <HeaderItem title={tab.title} active={isActive} />}
                                </NavLink>
                            )
                        }

                        <HeaderNavDropdown
                            title={t("header_investments")}
                            active={isInvestmentsActive}
                            items={investmentItems}
                        />

                        {
                            trailingTabs.map(tab =>
                                <NavLink key={tab.path} to={tab.path} className={({ isActive }) => isActive ? 'active' : ''}>
                                    {({ isActive }) => <HeaderItem title={tab.title} active={isActive} />}
                                </NavLink>
                            )
                        }

                        <HeaderNavDropdown
                            title={t("header_crypto")}
                            active={isCryptoActive}
                            items={cryptoItems}
                        />

                        {
                            endingTabs.map(tab =>
                                <NavLink key={tab.path} to={tab.path} className={({ isActive }) => isActive ? 'active' : ''}>
                                    {({ isActive }) => <HeaderItem title={tab.title} active={isActive} />}
                                </NavLink>
                            )
                        }
                    </Flex>
                </Flex>
                <Flex width="auto" justify="flex-end" direction="row" gap={2}>
                    <HeaderNotificationBell />
                    <Button
                        borderColor="background_secondary"
                        background="button_background_secondary"
                        color="text_primary"
                        size={'md'}
                        onClick={onOpenActionsClick}
                        title={t("header_actions_title")}
                    >
                        <Icon color="card_action_icon_primary">
                            <AiFillTool />
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
