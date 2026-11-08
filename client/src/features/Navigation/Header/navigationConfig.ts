import { ElementType } from 'react';
import { TFunction } from 'i18next';
import {
    MdAccountBalance,
    MdAccountBalanceWallet,
    MdCurrencyBitcoin,
    MdHandshake,
    MdReceiptLong,
    MdSavings,
    MdSchedule,
    MdShowChart,
    MdStorage
} from 'react-icons/md';

export interface HeaderNavDropdownItem {
    path: string;
    title: string;
    description?: string;
    icon: ElementType;
}

export interface SingleNavItem {
    type: 'link';
    path: string;
    title: string;
    icon: ElementType;
    exact?: boolean;
}

export interface DropdownNavItem {
    type: 'dropdown';
    title: string;
    items: HeaderNavDropdownItem[];
    activePrefixes: string[];
}

export type NavItem = SingleNavItem | DropdownNavItem;

export const getNavigationItems = (t: TFunction): NavItem[] => [
    {
        type: 'link',
        path: '/accounts',
        title: t('header_accounts'),
        icon: MdAccountBalance
    },
    {
        type: 'link',
        path: '/transactions',
        title: t('header_transactions'),
        icon: MdReceiptLong
    },
    {
        type: 'link',
        path: '/deposits',
        title: t('header_deposits'),
        icon: MdSavings
    },
    {
        type: 'link',
        path: '/debts',
        title: t('header_debts'),
        icon: MdHandshake
    },
    {
        type: 'dropdown',
        title: t('header_investments'),
        activePrefixes: ['/broker_accounts', '/securities', '/broker_account/', '/security/'],
        items: [
            {
                path: '/broker_accounts',
                title: t('header_broker_accounts_short'),
                description: t('header_broker_accounts_desc'),
                icon: MdAccountBalance
            },
            {
                path: '/securities',
                title: t('header_securities'),
                description: t('header_securities_desc'),
                icon: MdShowChart
            }
        ]
    },
    {
        type: 'dropdown',
        title: t('header_crypto'),
        activePrefixes: ['/crypto_accounts', '/cryptocurrencies', '/crypto_account/'],
        items: [
            {
                path: '/crypto_accounts',
                title: t('header_crypto_accounts_short'),
                description: t('header_crypto_accounts_desc'),
                icon: MdAccountBalanceWallet
            },
            {
                path: '/cryptocurrencies',
                title: t('header_cryptocurrencies'),
                description: t('header_cryptocurrencies_desc'),
                icon: MdCurrencyBitcoin
            }
        ]
    },
    {
        type: 'dropdown',
        title: t('header_configuration'),
        activePrefixes: ['/scheduler', '/data'],
        items: [
            {
                path: '/scheduler',
                title: t('header_scheduler'),
                description: t('header_scheduler_desc'),
                icon: MdSchedule
            },
            {
                path: '/data',
                title: t('header_data'),
                description: t('header_data_desc'),
                icon: MdStorage
            }
        ]
    }
];

