import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tabs } from "@chakra-ui/react";
import { GrTransaction } from "react-icons/gr";
import { PiCoinsLight } from "react-icons/pi";
import { MdAttachMoney, MdQueryStats, MdHistory } from "react-icons/md";
import { IoMdStats } from "react-icons/io";
import { TbTax } from "react-icons/tb";
import BrokerAccountDailyStats from "@/pages/BrokerAccount/components/BrokerAccountDailyStats/BrokerAccountDailyStats";
import BrokerAccountFundTransfersList from "@/pages/BrokerAccount/components/BrokerAccountFundTransfersList/BrokerAccountFundTransfersList";
import BrokerAccountStats from "@/pages/BrokerAccount/components/BrokerAccountStats/BrokerAccountStats";
import BrokerAccountPortfolioHistory from "@/pages/BrokerAccount/components/BrokerAccountPortfolioHistory/BrokerAccountPortfolioHistory";
import BrokerAccountTaxDeductionsList from "@/pages/BrokerAccount/components/BrokerAccountTaxDeductionsList/BrokerAccountTaxDeductionsList";
import DividendPaymentsList from "@/pages/BrokerAccount/components/DividendPaymentsList/DividendPaymentsList";
import SecurityTransactionsList from "@/pages/BrokerAccount/components/SecurityTransactionsList/SecurityTransactionsList";
import { Nullable } from "@/shared/utilities/nullable";
import BrokerAccountsList from "@/pages/BrokerAccounts/components/BrokerAccountsList/BrokerAccountsList";
import ResponsiveTabsList, { ResponsiveTabItem } from "@/shared/components/ResponsiveTabs/ResponsiveTabsList";
import { ChangeAction } from "./types";

interface Props {
    brokerAccountId?: Nullable<string>
    currencyName: string
    onActionTriggered: (action: ChangeAction) => void
}

const BrokerAccountTabs: React.FC<Props> = ({ brokerAccountId, currencyName, onActionTriggered }) => {
    const { t } = useTranslation();

    const onTransactionsChanged = useCallback(async () => {
        await onActionTriggered(ChangeAction.TransactionsChanged);
    }, [onActionTriggered]);

    const onBrokerAccountFundTransfersChanged = useCallback(async () => {
       await onActionTriggered(ChangeAction.FundTransfersChanged);
    }, [onActionTriggered]);

    const onDividendsChanged = useCallback(async () => {
        await onActionTriggered(ChangeAction.DividendsChanged);
    }, [onActionTriggered]);

    const onTaxDeductionsChanged = useCallback(async () => {
        await onActionTriggered(ChangeAction.TaxDeductionsChanged);
    }, [onActionTriggered]);

    const tabItems: ResponsiveTabItem[] = [
        {
            value: "daily_stats",
            label: t("broker_account_page_daily_stats_tab"),
            icon: IoMdStats
        },
        ...(!brokerAccountId
            ? [{
                value: "broker_accounts",
                label: t("broker_account_page_broker_accounts_tab"),
                icon: IoMdStats
            }]
            : []
        ),
        {
            value: "stats",
            label: t("broker_account_page_account_stats_tab"),
            icon: MdQueryStats
        },
        {
            value: "history",
            label: t("broker_account_page_history_tab"),
            icon: MdHistory
        },
        {
            value: "transactions",
            label: t("broker_account_page_transactions_tab"),
            icon: GrTransaction
        },
        {
            value: "dividends",
            label: t("broker_account_page_dividends_tab"),
            icon: PiCoinsLight
        },
        {
            value: "transfers",
            label: t("broker_account_page_transfers_tab"),
            icon: MdAttachMoney
        },
        {
            value: "tax_deductions",
            label: t("broker_account_page_deduction_taxes_tab"),
            icon: TbTax
        }
    ];

    return (
        <Tabs.Root
            lazyMount={true}
            unmountOnExit={true}
            variant="enclosed"
            defaultValue="daily_stats"
        >
            <ResponsiveTabsList items={tabItems} breakpoint="lg" />
        {
            !brokerAccountId &&
            <Tabs.Content value="broker_accounts">
                <BrokerAccountsList/>
            </Tabs.Content>
        }
        <Tabs.Content value="daily_stats">
            <BrokerAccountDailyStats currencyName={currencyName} brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
        <Tabs.Content value="stats">
            <BrokerAccountStats brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
        <Tabs.Content value="history">
            <BrokerAccountPortfolioHistory brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
        <Tabs.Content value="transactions">
            <SecurityTransactionsList onTransactionsChanged={onTransactionsChanged} brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
        <Tabs.Content value="dividends">
            <DividendPaymentsList onDividendsChanged={onDividendsChanged} brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
        <Tabs.Content value="transfers">
            <BrokerAccountFundTransfersList onDataChanged={onBrokerAccountFundTransfersChanged} brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
        <Tabs.Content value="tax_deductions">
            <BrokerAccountTaxDeductionsList onDataChanged={onTaxDeductionsChanged} brokerAccountId={brokerAccountId}/>
        </Tabs.Content>
    </Tabs.Root>
    );
};

export default BrokerAccountTabs;