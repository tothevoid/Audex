import { Fragment, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CryptoAccountEntity } from "@/models/crypto/CryptoAccountEntity";
import { getCryptoAccountById } from "@/api/crypto/cryptoAccountApi";
import CryptoAccountCryptocurrenciesList from "./components/CryptoAccountCryptocurrenciesList/CryptoAccountCryptocurrenciesList";
import CryptoAccountTabs from "./components/CryptoAccountTabs/CryptoAccountTabs";

interface State {
    cryptoAccount: CryptoAccountEntity | null,
    isReloading: boolean
}

const CryptoAccountPage: React.FC = () => {
    const { cryptoAccountId } = useParams();

    const [state, setState] = useState<State>({ cryptoAccount: null, isReloading: false });
    const [dataVersion, setDataVersion] = useState(0);

    const fetchCryptoAccount = useCallback(async () => {
        if (!cryptoAccountId) {
            return;
        }

        const cryptoAccount = await getCryptoAccountById(cryptoAccountId);
        if (!cryptoAccount) {
            return;
        }

        setState((currentState) => {
            return { ...currentState, cryptoAccount, isReloading: false };
        });
    }, [cryptoAccountId]);

    const handleDataChanged = useCallback(async () => {
        await fetchCryptoAccount();
        setDataVersion((v) => v + 1);
    }, [fetchCryptoAccount]);

    useEffect(() => {
        fetchCryptoAccount();
    }, [fetchCryptoAccount]);

    if (!cryptoAccountId || !state.cryptoAccount) {
        return <Fragment />;
    }

    return (
        <Fragment>
            <CryptoAccountCryptocurrenciesList
                cryptoAccount={state.cryptoAccount}
                onDataChanged={handleDataChanged}
            />
            <CryptoAccountTabs
                cryptoAccountId={cryptoAccountId}
                onDataChanged={handleDataChanged}
                dataVersion={dataVersion}
            />
        </Fragment>
    );
};

export default CryptoAccountPage;