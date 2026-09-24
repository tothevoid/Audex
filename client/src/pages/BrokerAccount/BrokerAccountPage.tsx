import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BrokerAccountEntity } from "../../models/brokers/BrokerAccountEntity";
import { getBrokerAccountById } from "../../api/brokers/brokerAccountApi";
import { getLastPullDate, pullBrokerAccountQuotations } from "../../api/brokers/brokerAccountSecurityApi";
import BrokerAccountSecuritiesList, { BrokerAccountSecuritiesListRef } from "./components/BrokerAccountSecuritiesList/BrokerAccountSecuritiesList";
import { useSignalR } from "../../shared/hooks/useSignalR";
import BrokerAccountTabs, { ChangeAction } from "./components/BrokerAccountTabs/BrokerAccountTabs";
import BrokerAccountHeader from "./components/BrokerAccountHeader/BrokerAccountHeader";
import { getPortfolioValues } from "../../api/brokers/brokerAccountSummaryApi";
import { BrokerAccountPortfolioEntity } from "../../models/brokers/BrokerAccountPortfolioEntity";
import { BrokerStatementImportModal } from "./modals/BrokerStatementImportModal/BrokerStatementImportModal";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";

interface State {
    brokerAccount: BrokerAccountEntity | null,
    isReloading: boolean
}

const BrokerAccountPage: React.FC = () => {
    const securitiesRef = useRef<BrokerAccountSecuritiesListRef>(null);
    const importModalRef = useRef<BaseModalRef>(null);

    const { brokerAccountId } = useParams();

    const [state, setState] = useState<State>({ brokerAccount: null, isReloading: false });
    
    const [lastPullDate, setLastPullDate] = useState<Date | null>(null);

    const [portfolio, setPortfolio] = useState<BrokerAccountPortfolioEntity | null>(null);

    const onQuotesRecalculated = async (message: string) => {
        const data = JSON.parse(message);
        
        if (data && data.date) {
            const newDate = new Date(data.date);
            setLastPullDate(newDate);
        }

        await onTransactionsChanged();
    }

    const fetchBrokerAccount = useCallback(async () => {
        if (!brokerAccountId) {
            return;
        }

        const brokerAccount = await getBrokerAccountById(brokerAccountId);
        if (!brokerAccount) {
            return;
        }

        setState((currentState) => {
            return {...currentState, brokerAccount, isReloading: false}
        })
    }, [brokerAccountId])

    const fetchLastPullDate = async () => {
        const lastPullDate = await getLastPullDate();
        if (lastPullDate) {
            setLastPullDate(lastPullDate);
        }
    }

    useSignalR(onQuotesRecalculated);

    useEffect(() => {
        const getData = async () => {
            await fetchBrokerAccount();
            await fetchLastPullDate();
        }

        getData();
    }, []);

    useEffect(() => {
        if (!state.brokerAccount) {
            return;
        }

        const account = state.brokerAccount;

        const fetchPortfolioValues = async () => {
            const values = await getPortfolioValues(account.id)
            if (values) {
                setPortfolio(values);
            }
        }

        fetchPortfolioValues()
    }, [state.brokerAccount]);

    const onTransactionsChanged = useCallback(async () => {
        await fetchBrokerAccount();
        await securitiesRef.current?.reloadData();
    }, []);


    if (!brokerAccountId) {
        return <Fragment/>
    }

    const pullQuotations = async () => {
       setState((currentState) => {
            return {...currentState, isReloading: true}
        })
        pullBrokerAccountQuotations(brokerAccountId);
    }

    const onActionTriggered = async (action: ChangeAction) => {
        switch (action) {
            case ChangeAction.TransactionsChanged:
                await onTransactionsChanged();
                break;
            case ChangeAction.FundTransfersChanged:
            case ChangeAction.DividendsChanged:
            case ChangeAction.TaxDeductionsChanged:
                await fetchBrokerAccount();
                break;
        }
    }

    if (!state.brokerAccount) {
        return <Fragment/>
    }

    return <Fragment>
        {portfolio && (
            <BrokerAccountHeader
                name={state.brokerAccount?.name ?? ""}
                currencyName={state.brokerAccount?.currency?.name ?? ""}
                portfolio={portfolio}
                onPullQuotations={pullQuotations}
                lastPullDate={lastPullDate}
                isReloading={state.isReloading}
                onImportStatement={() => importModalRef.current?.openModal()}
            />
        )}
        <BrokerAccountSecuritiesList ref={securitiesRef} brokerAccountId={state.brokerAccount.id}/>
        <BrokerAccountTabs currencyName={state?.brokerAccount?.currency?.name} brokerAccountId={brokerAccountId} onActionTriggered={onActionTriggered}/>
        <BrokerStatementImportModal
            ref={importModalRef}
            defaultBrokerAccountId={brokerAccountId}
            onImportSuccess={onTransactionsChanged}
        />
    </Fragment>
}


export default BrokerAccountPage;