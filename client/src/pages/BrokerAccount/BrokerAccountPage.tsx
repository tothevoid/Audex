import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { getBrokerAccountById } from "@/api/brokers/brokerAccountApi";
import { getLastPullDate, pullBrokerAccountQuotations } from "@/api/brokers/brokerAccountSecurityApi";
import { useSignalR } from "@/shared/hooks/useSignalR";
import BrokerAccountSecuritiesList from "./components/BrokerAccountSecuritiesList/BrokerAccountSecuritiesList";
import BrokerAccountTabs from "./components/BrokerAccountTabs/BrokerAccountTabs";
import { ChangeAction } from "./components/BrokerAccountTabs/types";
import BrokerAccountHeader from "./components/BrokerAccountHeader/BrokerAccountHeader";
import { getPortfolioValues } from "@/api/brokers/brokerAccountSummaryApi";
import { BrokerAccountPortfolioEntity } from "@/models/brokers/BrokerAccountPortfolioEntity";
import { BrokerStatementImportModal } from "./modals/BrokerStatementImportModal/BrokerStatementImportModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { QuotesRecalculatedEventPayload } from "@/models/securities/QuotesRecalculatedEventPayload";
import { ServerNotificationEvents } from "@/shared/constants/serverNotificationEvents";

interface State {
    brokerAccount: BrokerAccountEntity | null,
    isReloading: boolean
}

const BrokerAccountPage: React.FC = () => {
    const importModalRef = useRef<BaseModalRef>(null);

    const { brokerAccountId } = useParams();

    const [state, setState] = useState<State>({ brokerAccount: null, isReloading: false });
    const [securitiesRefreshTrigger, setSecuritiesRefreshTrigger] = useState<number>(0);
    
    const [lastPullDate, setLastPullDate] = useState<Date | null>(null);

    const [portfolio, setPortfolio] = useState<BrokerAccountPortfolioEntity | null>(null);


    const fetchBrokerAccount = useCallback(async () => {
        if (!brokerAccountId) {
            return;
        }

        const brokerAccount = await getBrokerAccountById(brokerAccountId);
        if (!brokerAccount) {
            return;
        }

        setState((currentState) => {
            return {...currentState, brokerAccount, isReloading: false};
        });
    }, [brokerAccountId]);

    const fetchLastPullDate = async () => {
        const lastPullDate = await getLastPullDate();
        if (lastPullDate) {
            setLastPullDate(lastPullDate);
        }
    };


    useEffect(() => {
        const getData = async () => {
            await fetchBrokerAccount();
            await fetchLastPullDate();
        };

        getData();
    }, [fetchBrokerAccount]);

    useEffect(() => {
        if (!state.brokerAccount) {
            return;
        }

        const account = state.brokerAccount;

        const fetchPortfolioValues = async () => {
            const values = await getPortfolioValues(account.id);
            if (values) {
                setPortfolio(values);
            }
        };

        fetchPortfolioValues();
    }, [state.brokerAccount]);

    const onTransactionsChanged = useCallback(async () => {
        await fetchBrokerAccount();
        setSecuritiesRefreshTrigger((previousTrigger) => previousTrigger + 1);
    }, [fetchBrokerAccount]);

    const onQuotesRecalculated = useCallback(async (eventPayload?: QuotesRecalculatedEventPayload) => {
        if (eventPayload?.date) {
            const newDate = new Date(eventPayload.date);
            setLastPullDate(newDate);
        }

        await onTransactionsChanged();
    }, [onTransactionsChanged]);

    useSignalR<QuotesRecalculatedEventPayload>(ServerNotificationEvents.QuotesRecalculated, onQuotesRecalculated);

    const onActionTriggered = useCallback(async (action: ChangeAction) => {
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
    }, [onTransactionsChanged, fetchBrokerAccount]);

    const pullQuotations = useCallback(async () => {
        if (!brokerAccountId) {
            return;
        }
        setState((currentState) => {
            return { ...currentState, isReloading: true };
        });
        await pullBrokerAccountQuotations(brokerAccountId);
    }, [brokerAccountId]);

    if (!brokerAccountId || !state.brokerAccount) {
        return <Fragment/>;
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
        <BrokerAccountSecuritiesList brokerAccountId={state.brokerAccount.id} refreshTrigger={securitiesRefreshTrigger}/>
        <BrokerAccountTabs currencyName={state?.brokerAccount?.currency?.name} brokerAccountId={brokerAccountId} onActionTriggered={onActionTriggered}/>
        <BrokerStatementImportModal
            ref={importModalRef}
            defaultBrokerAccountId={brokerAccountId}
            onImportSuccess={onTransactionsChanged}
        />
    </Fragment>;
};


export default BrokerAccountPage;