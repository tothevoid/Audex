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

interface Props {
    brokerAccountId?: Nullable<string>
    currencyName: string
    onActionTriggered: (action: ChangeAction) => void
}

export enum ChangeAction {
	TransactionsChanged,
    FundTransfersChanged,
    DividendsChanged,
    TaxDeductionsChanged
}

const BrokerAccountTabs: React.FC<Props> = ({ brokerAccountId, currencyName, onActionTriggered }) => {
    const { t } = useTranslation();

    const onTransactionsChanged = useCallback(async () => {
        onActionTriggered(ChangeAction.TransactionsChanged);
    }, []);

    const onBrokerAccountFundTransfersChanged = useCallback(async () => {
       onActionTriggered(ChangeAction.FundTransfersChanged);
    }, []);

    const onDividendsChanged = useCallback(async () => {
        onActionTriggered(ChangeAction.DividendsChanged);
    }, []);

    const onTaxDeductionsChanged = useCallback(async () => {
        onActionTriggered(ChangeAction.TaxDeductionsChanged);
    }, []);

    return <Tabs.Root lazyMount={true} unmountOnExit={true} variant="enclosed" 
        defaultValue={"daily_stats"}>
        <Tabs.List>
            <Tabs.Trigger value="daily_stats">
                <IoMdStats/>
                    {t("broker_account_page_daily_stats_tab")}
            </Tabs.Trigger>
            {
                !brokerAccountId &&
                <Tabs.Trigger value="broker_accounts">
                    <IoMdStats/>
                        {t("broker_account_page_broker_accounts_tab")}
                </Tabs.Trigger>
            }
            <Tabs.Trigger value="stats">
                <MdQueryStats />
                    {t("broker_account_page_account_stats_tab")}
            </Tabs.Trigger>
            <Tabs.Trigger value="history">
                <MdHistory />
                    {t("broker_account_page_history_tab")}
            </Tabs.Trigger>
            <Tabs.Trigger value="transactions">
                <GrTransaction />
                {t("broker_account_page_transactions_tab")}
            </Tabs.Trigger>
            <Tabs.Trigger value="dividends">
                <PiCoinsLight />
                    {t("broker_account_page_dividends_tab")}
            </Tabs.Trigger>
            <Tabs.Trigger value="transfers">
                <MdAttachMoney />
                    {t("broker_account_page_transfers_tab")}
            </Tabs.Trigger>
            <Tabs.Trigger value="tax_deductions">
                <TbTax />
                    {t("broker_account_page_deduction_taxes_tab")}
            </Tabs.Trigger>
        </Tabs.List>
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
}

export default BrokerAccountTabs;