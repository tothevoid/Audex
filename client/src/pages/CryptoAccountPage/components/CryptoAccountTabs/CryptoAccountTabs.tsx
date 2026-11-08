import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs } from "@chakra-ui/react";
import { IoMdStats } from "react-icons/io";
import { MdQueryStats } from "react-icons/md";
import CryptoAccountsList from "@/pages/CryptoAccountsPage/components/CryptoAccountsList/CryptoAccountsList";
import CryptoAccountStats from "@/pages/CryptoAccountPage/components/CryptoAccountStats/CryptoAccountStats";
import ResponsiveTabsList, { ResponsiveTabItem } from "@/shared/components/ResponsiveTabs/ResponsiveTabsList";

interface Props {
    cryptoAccountId?: string;
    onDataChanged: () => void;
    dataVersion?: number;
}

const CryptoAccountTabs: React.FC<Props> = ({ cryptoAccountId, onDataChanged, dataVersion }) => {
    const { t } = useTranslation();

    if (cryptoAccountId) {
        return <CryptoAccountStats cryptoAccountId={cryptoAccountId} dataVersion={dataVersion} />;
    }

    const tabItems: ResponsiveTabItem[] = [
        {
            value: "crypto_accounts",
            label: t("crypto_accounts_tab"),
            icon: IoMdStats
        },
        {
            value: "stats",
            label: t("crypto_account_page_account_stats_tab"),
            icon: MdQueryStats
        }
    ];

    return (
        <Tabs.Root
            lazyMount={true}
            unmountOnExit={true}
            variant="enclosed"
            defaultValue="crypto_accounts"
        >
            <ResponsiveTabsList items={tabItems} breakpoint="sm" />

            <Tabs.Content value="crypto_accounts">
                <CryptoAccountsList onDataChanged={onDataChanged} />
            </Tabs.Content>
            <Tabs.Content value="stats">
                <CryptoAccountStats dataVersion={dataVersion} />
            </Tabs.Content>
        </Tabs.Root>
    );
};

export default CryptoAccountTabs;
