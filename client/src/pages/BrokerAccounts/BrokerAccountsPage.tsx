import { Fragment } from "react/jsx-runtime";
import BrokerAccountHeader from "../BrokerAccount/components/BrokerAccountHeader/BrokerAccountHeader";
import BrokerAccountSecuritiesList, { BrokerAccountSecuritiesListRef } from "../BrokerAccount/components/BrokerAccountSecuritiesList/BrokerAccountSecuritiesList";
import BrokerAccountTabs, { ChangeAction } from "../BrokerAccount/components/BrokerAccountTabs/BrokerAccountTabs";
import { useUserProfile } from "../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import { getLastPullDate, pullBrokerAccountQuotations } from "../../api/brokers/brokerAccountSecurityApi";
import { useSignalR } from "../../shared/hooks/useSignalR";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPortfolioValues } from "../../api/brokers/brokerAccountSummaryApi";
import { BrokerAccountPortfolioEntity } from "../../models/brokers/BrokerAccountPortfolioEntity";
import { BrokerStatementImportModal } from "../BrokerAccount/modals/BrokerStatementImportModal/BrokerStatementImportModal";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";

interface State {
    isReloading: boolean
}

const BrokerAccountsPage: React.FC = () => {
    const { t } = useTranslation();
    const securitiesRef = useRef<BrokerAccountSecuritiesListRef>(null);
    const importModalRef = useRef<BaseModalRef>(null);
    const { user } = useUserProfile();
    // TODO: Currency can be different for each account
    const currencyName = user?.currency.name ?? "USD";

    const [state, setState] = useState<State>({ isReloading: false });

    const [portfolio, setPortfolio] = useState<BrokerAccountPortfolioEntity | null>(null);

    const [lastPullDate, setLastPullDate] = useState<Date | null>(null);
    
    const fetchBrokerAccountsSummary = useCallback(async () => {
        setState((state) => {
            return {...state, isReloading: false}
        });

        const fetchPortfolioValues = async () => {
            const values = await getPortfolioValues()
            if (values) {
                setPortfolio(values);
            }
        }

        fetchPortfolioValues();
    }, []);
    
    const onTransactionsChanged = useCallback(async () => {
        await fetchBrokerAccountsSummary();
        await securitiesRef.current?.reloadData();
    }, []);

    const onQuotesRecalculated = async (message: string) => {
        const data = JSON.parse(message);
        
        if (data && data.date) {
            const newDate = new Date(data.date);
            setLastPullDate(newDate);
        }

        await onTransactionsChanged();
    }

    const fetchLastPullDate = async () => {
        const lastPullDate = await getLastPullDate();
        if (lastPullDate) {
            setLastPullDate(lastPullDate);
        }
    }

    useEffect(() => {
        const getData = async () => {
            await fetchBrokerAccountsSummary();
            await fetchLastPullDate();
        }
        getData();
    }, []);

    const pullQuotations = async () => {
        setState((currentState) => {
            return {...currentState, isReloading: true}
        })
        pullBrokerAccountQuotations();
    }
    
    useSignalR(onQuotesRecalculated);

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
    }

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
        <BrokerAccountSecuritiesList ref={securitiesRef} />
        <BrokerAccountTabs 
            currencyName={currencyName} 
            onActionTriggered={onActionTriggered}/>
        <BrokerStatementImportModal
            ref={importModalRef}
            onImportSuccess={onTransactionsChanged}
        />
    </Fragment>
}

export default BrokerAccountsPage;