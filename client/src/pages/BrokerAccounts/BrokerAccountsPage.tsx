import { Fragment } from "react/jsx-runtime";
import BrokerAccountHeader from "@/pages/BrokerAccount/components/BrokerAccountHeader/BrokerAccountHeader";
import BrokerAccountTabs from "@/pages/BrokerAccount/components/BrokerAccountTabs/BrokerAccountTabs";
import { ChangeAction } from "@/pages/BrokerAccount/components/BrokerAccountTabs/types";
import BrokerAccountSecuritiesList from "@/pages/BrokerAccount/components/BrokerAccountSecuritiesList/BrokerAccountSecuritiesList";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { getLastPullDate, pullBrokerAccountQuotations } from "@/api/brokers/brokerAccountSecurityApi";
import { useSignalR } from "@/shared/hooks/useSignalR";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPortfolioValues } from "@/api/brokers/brokerAccountSummaryApi";
import { BrokerAccountPortfolioEntity } from "@/models/brokers/BrokerAccountPortfolioEntity";
import { BrokerStatementImportModal } from "@/pages/BrokerAccount/modals/BrokerStatementImportModal/BrokerStatementImportModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { QuotesRecalculatedEventPayload } from "@/models/securities/QuotesRecalculatedEventPayload";
import { ServerNotificationEvents } from "@/shared/constants/serverNotificationEvents";

interface State {
    isReloading: boolean
}

const BrokerAccountsPage: React.FC = () => {
    const { t } = useTranslation();
    const importModalRef = useRef<BaseModalRef>(null);
    const { user } = useUserProfile();
    // TODO: Currency can be different for each account
    const currencyName = user?.currency.name ?? "USD";

    const [state, setState] = useState<State>({ isReloading: false });
    const [securitiesRefreshTrigger, setSecuritiesRefreshTrigger] = useState<number>(0);

    const [portfolio, setPortfolio] = useState<BrokerAccountPortfolioEntity | null>(null);

    const [lastPullDate, setLastPullDate] = useState<Date | null>(null);
    
    const fetchBrokerAccountsSummary = useCallback(async () => {
        setState((state) => {
            return {...state, isReloading: false};
        });

        const values = await getPortfolioValues();
        if (values) {
            setPortfolio(values);
        }
    }, []);
    
    const onTransactionsChanged = useCallback(async () => {
        await fetchBrokerAccountsSummary();
        setSecuritiesRefreshTrigger((previousTrigger) => previousTrigger + 1);
    }, [fetchBrokerAccountsSummary]);

    const onQuotesRecalculated = useCallback(async (eventPayload?: QuotesRecalculatedEventPayload) => {
        if (eventPayload?.date) {
            const newDate = new Date(eventPayload.date);
            setLastPullDate(newDate);
        }

        await onTransactionsChanged();
    }, [onTransactionsChanged]);

    const fetchLastPullDate = async () => {
        const lastPullDate = await getLastPullDate();
        if (lastPullDate) {
            setLastPullDate(lastPullDate);
        }
    };

    useEffect(() => {
        const getData = async () => {
            await fetchBrokerAccountsSummary();
            await fetchLastPullDate();
        };
        getData();
    }, [fetchBrokerAccountsSummary]);

    const pullQuotations = async () => {
        setState((currentState) => {
            return {...currentState, isReloading: true};
        });
        await pullBrokerAccountQuotations();
    };
    
    useSignalR<QuotesRecalculatedEventPayload>(ServerNotificationEvents.QuotesRecalculated, onQuotesRecalculated);

    const onActionTriggered = async (action: ChangeAction) => {
        switch (action) {
            case ChangeAction.TransactionsChanged:
                await onTransactionsChanged();
                break;
            case ChangeAction.FundTransfersChanged:
            case ChangeAction.DividendsChanged:
            case ChangeAction.TaxDeductionsChanged:
                await fetchBrokerAccountsSummary();
                break;
        }
    };

    return <Fragment>
        {
            portfolio && <BrokerAccountHeader 
                name={t("all_broker_accounts_header")}
                currencyName={currencyName}
                portfolio={portfolio}
                lastPullDate={lastPullDate}
                isReloading={state.isReloading}
                onPullQuotations={pullQuotations} 
                onImportStatement={() => importModalRef.current?.openModal()}
            />
        }
        <BrokerAccountSecuritiesList refreshTrigger={securitiesRefreshTrigger} />
        <BrokerAccountTabs 
            currencyName={currencyName} 
            onActionTriggered={onActionTriggered}/>
        <BrokerStatementImportModal
            ref={importModalRef}
            onImportSuccess={onTransactionsChanged}
        />
    </Fragment>;
};

export default BrokerAccountsPage;